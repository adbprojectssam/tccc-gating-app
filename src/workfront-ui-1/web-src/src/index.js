/*
* <license header>
*/

import 'core-js/stable'

import { createRoot } from 'react-dom/client'

import App from './components/App'
import '@react-spectrum/s2/page.css'
import './index.css'

createRoot(document.getElementById('root')).render(
  <App />
)
