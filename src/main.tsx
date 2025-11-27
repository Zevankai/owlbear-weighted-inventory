import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import TradeWindow from './TradeWindow'
import './index.css'
import OBR from '@owlbear-rodeo/sdk'
import { MAIN_POPOVER_ID, DEFAULT_POPOVER_WIDTH } from './constants'

OBR.onReady(() => {
  OBR.contextMenu.create({
    id: "com.weighted-inventory.context-menu",
    icons: [
      {
        icon: "/vite.svg",
        label: "Inventory",
        filter: {
          every: [
            { key: "layer", value: "CHARACTER" },
          ],
        },
      },
    ],
    onClick() {
      OBR.popover.open({
        id: MAIN_POPOVER_ID,
        url: "/",
        height: 600,
        width: DEFAULT_POPOVER_WIDTH,
      });
    },
  });

  // Simple routing based on pathname
  const path = window.location.pathname;
  const Component = path === '/trade' ? TradeWindow : App;

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <Component />
    </React.StrictMode>,
  )
});