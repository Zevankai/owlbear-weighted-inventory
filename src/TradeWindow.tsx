import { useState, useEffect } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import { TradeModal } from './components/TradeModal';
import type { ActiveTrade, CharacterData, Item, Currency } from './types';
import { getTotalCopperPieces, deductCopperPieces, addCopperPieces } from './utils/currency';

const ACTIVE_TRADE_KEY = 'com.weighted-inventory/active-trade';

export default function TradeWindow() {
  const [activeTrade, setActiveTrade] = useState<ActiveTrade | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerData, setPlayerData] = useState<CharacterData | null>(null);
  const [otherPlayerData, setOtherPlayerData] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize OBR and get player info
  useEffect(() => {
    OBR.onReady(async () => {
      const id = await OBR.player.getId();
      setPlayerId(id);
      setLoading(false);
    });
  }, []);

  // Poll for trade updates and token data
  useEffect(() => {
    if (!playerId) return;

    const pollTrade = async () => {
      try {
        const metadata = await OBR.room.getMetadata();
        const trade = metadata[ACTIVE_TRADE_KEY] as ActiveTrade | undefined;

        if (!trade) {
          // Trade was cancelled or completed, close window
          OBR.popover.close("com.weighted-inventory.trade-window");
          return;
        }

        setActiveTrade(trade);

        // Determine which token belongs to this player
        const myTokenId = trade.player1Id === playerId ? trade.player1TokenId : trade.player2TokenId;
        const otherTokenId = trade.player1Id === playerId ? trade.player2TokenId : trade.player1TokenId;

        // Get token data for both players
        const tokens = await OBR.scene.items.getItems([myTokenId, otherTokenId]);

        const myToken = tokens.find(t => t.id === myTokenId);
        const otherToken = tokens.find(t => t.id === otherTokenId);

        if (myToken) {
          const data = myToken.metadata['com.weighted-inventory/data'] as CharacterData;
          setPlayerData(data);
        }

        if (otherToken) {
          const data = otherToken.metadata['com.weighted-inventory/data'] as CharacterData;
          setOtherPlayerData(data);
        }
      } catch (err) {
        console.error('Error polling trade:', err);
      }
    };

    // Poll immediately and then every 2 seconds
    pollTrade();
    const interval = setInterval(pollTrade, 2000);

    return () => clearInterval(interval);
  }, [playerId]);

  // Handle adding an item to the trade offer
  const handleAddItem = async (item: Item) => {
    if (!activeTrade || !playerId) return;

    const isPlayer1 = activeTrade.player1Id === playerId;
    const currentOfferedItems = isPlayer1 ? activeTrade.player1OfferedItems : activeTrade.player2OfferedItems;

    // Check if item is already offered
    if (currentOfferedItems.some(i => i.id === item.id)) return;

    const updatedTrade: ActiveTrade = {
      ...activeTrade,
      ...(isPlayer1
        ? { player1OfferedItems: [...activeTrade.player1OfferedItems, item], player1Confirmed: false }
        : { player2OfferedItems: [...activeTrade.player2OfferedItems, item], player2Confirmed: false }
      )
    };

    await OBR.room.setMetadata({ [ACTIVE_TRADE_KEY]: updatedTrade });
  };

  // Handle removing an item from the trade offer
  const handleRemoveItem = async (item: Item) => {
    if (!activeTrade || !playerId) return;

    const isPlayer1 = activeTrade.player1Id === playerId;

    const updatedTrade: ActiveTrade = {
      ...activeTrade,
      ...(isPlayer1
        ? {
            player1OfferedItems: activeTrade.player1OfferedItems.filter(i => i.id !== item.id),
            player1Confirmed: false
          }
        : {
            player2OfferedItems: activeTrade.player2OfferedItems.filter(i => i.id !== item.id),
            player2Confirmed: false
          }
      )
    };

    await OBR.room.setMetadata({ [ACTIVE_TRADE_KEY]: updatedTrade });
  };

  // Handle updating coins offered
  const handleUpdateCoins = async (coins: Currency) => {
    if (!activeTrade || !playerId) return;

    const isPlayer1 = activeTrade.player1Id === playerId;

    const updatedTrade: ActiveTrade = {
      ...activeTrade,
      ...(isPlayer1
        ? { player1OfferedCoins: coins, player1Confirmed: false }
        : { player2OfferedCoins: coins, player2Confirmed: false }
      )
    };

    await OBR.room.setMetadata({ [ACTIVE_TRADE_KEY]: updatedTrade });
  };

  // Handle confirming the trade
  const handleConfirm = async () => {
    if (!activeTrade || !playerId) return;

    const isPlayer1 = activeTrade.player1Id === playerId;

    const updatedTrade: ActiveTrade = {
      ...activeTrade,
      ...(isPlayer1
        ? { player1Confirmed: true }
        : { player2Confirmed: true }
      )
    };

    await OBR.room.setMetadata({ [ACTIVE_TRADE_KEY]: updatedTrade });

    // Check if both players have confirmed
    const bothConfirmed = isPlayer1
      ? updatedTrade.player1Confirmed && activeTrade.player2Confirmed
      : activeTrade.player1Confirmed && updatedTrade.player2Confirmed;

    if (bothConfirmed) {
      await executeTrade(updatedTrade);
    }
  };

  // Execute the trade (transfer items between tokens)
  const executeTrade = async (trade: ActiveTrade) => {
    try {
      const tokenIds = [trade.player1TokenId, trade.player2TokenId];

      await OBR.scene.items.updateItems(tokenIds, (items) => {
        const player1Token = items.find(t => t.id === trade.player1TokenId);
        const player2Token = items.find(t => t.id === trade.player2TokenId);

        if (player1Token && player2Token) {
          const player1Data = player1Token.metadata['com.weighted-inventory/data'] as CharacterData;
          const player2Data = player2Token.metadata['com.weighted-inventory/data'] as CharacterData;

          // Transfer items from player1 to player2
          trade.player1OfferedItems.forEach(item => {
            player1Data.inventory = player1Data.inventory.filter(i => i.id !== item.id);
            player2Data.inventory.push({ ...item, equippedSlot: null, isAttuned: false });
          });

          // Transfer items from player2 to player1
          trade.player2OfferedItems.forEach(item => {
            player2Data.inventory = player2Data.inventory.filter(i => i.id !== item.id);
            player1Data.inventory.push({ ...item, equippedSlot: null, isAttuned: false });
          });

          // Ensure currency objects exist
          if (!player1Data.currency) player1Data.currency = { cp: 0, sp: 0, gp: 0, pp: 0 };
          if (!player2Data.currency) player2Data.currency = { cp: 0, sp: 0, gp: 0, pp: 0 };

          // Get coin offers
          const p1CoinsOffered = trade.player1OfferedCoins || { cp: 0, sp: 0, gp: 0, pp: 0 };
          const p2CoinsOffered = trade.player2OfferedCoins || { cp: 0, sp: 0, gp: 0, pp: 0 };

          // Convert to copper for transfer
          const p1CoinsCp = getTotalCopperPieces(p1CoinsOffered);
          const p2CoinsCp = getTotalCopperPieces(p2CoinsOffered);

          // Deduct player1's offered coins and give to player2
          if (p1CoinsCp > 0) {
            const success = deductCopperPieces(player1Data.currency, p1CoinsCp);
            if (!success) {
              throw new Error(`${trade.player1Name} does not have enough coins!`);
            }
            addCopperPieces(player2Data.currency, p1CoinsCp);
          }

          // Deduct player2's offered coins and give to player1
          if (p2CoinsCp > 0) {
            const success = deductCopperPieces(player2Data.currency, p2CoinsCp);
            if (!success) {
              throw new Error(`${trade.player2Name} does not have enough coins!`);
            }
            addCopperPieces(player1Data.currency, p2CoinsCp);
          }

          player1Token.metadata['com.weighted-inventory/data'] = player1Data;
          player2Token.metadata['com.weighted-inventory/data'] = player2Data;
        }
      });

      // Clear trade and close window
      await OBR.room.setMetadata({ [ACTIVE_TRADE_KEY]: undefined });
      alert('Trade completed successfully!');
      OBR.popover.close("com.weighted-inventory.trade-window");
    } catch (err) {
      console.error('Failed to execute trade:', err);
      alert(`Trade failed! ${err instanceof Error ? err.message : 'Check console for details.'}`);
    }
  };

  // Handle cancelling the trade
  const handleCancel = async () => {
    if (!activeTrade) return;

    await OBR.room.setMetadata({ [ACTIVE_TRADE_KEY]: undefined });
    OBR.popover.close("com.weighted-inventory.trade-window");
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--background)',
        color: 'var(--text-main)'
      }}>
        Loading trade...
      </div>
    );
  }

  if (!activeTrade || !playerData || !otherPlayerData) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--background)',
        color: 'var(--text-main)'
      }}>
        Waiting for trade data...
      </div>
    );
  }

  const isPlayer1 = activeTrade.player1Id === playerId;
  const myOfferedItems = isPlayer1 ? activeTrade.player1OfferedItems : activeTrade.player2OfferedItems;
  const myOfferedCoins = isPlayer1 ? activeTrade.player1OfferedCoins : activeTrade.player2OfferedCoins;
  const theirOfferedItems = isPlayer1 ? activeTrade.player2OfferedItems : activeTrade.player1OfferedItems;
  const theirOfferedCoins = isPlayer1 ? activeTrade.player2OfferedCoins : activeTrade.player1OfferedCoins;
  const myConfirmed = isPlayer1 ? activeTrade.player1Confirmed : activeTrade.player2Confirmed;
  const theirConfirmed = isPlayer1 ? activeTrade.player2Confirmed : activeTrade.player1Confirmed;

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <TradeModal
        isOpen={true}
        onClose={handleCancel}
        activeTrade={activeTrade}
        playerId={playerId}
        playerInventory={playerData.inventory || []}
        playerCurrency={playerData.currency || { cp: 0, sp: 0, gp: 0, pp: 0 }}
        otherPlayerInventory={otherPlayerData.inventory || []}
        otherPlayerCurrency={otherPlayerData.currency || { cp: 0, sp: 0, gp: 0, pp: 0 }}
        myOfferedItems={myOfferedItems}
        myOfferedCoins={myOfferedCoins}
        theirOfferedItems={theirOfferedItems}
        theirOfferedCoins={theirOfferedCoins}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onUpdateCoins={handleUpdateCoins}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        myConfirmed={myConfirmed}
        theirConfirmed={theirConfirmed}
      />
    </div>
  );
}
