import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import OBR from '@owlbear-rodeo/sdk'

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
        id: "com.weighted-inventory.popover",
        url: "/",
        height: 600,
        width: 400,
      });
    },
  });

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
});