import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './i18n'
import { App } from './App'
import './style.css'
import './mobile.css'
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#f4d882' },
    background: { default: '#102c25' },
  },
  typography: { fontFamily: 'Arial, sans-serif' },
  shape: { borderRadius: 20 },
})
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Missing #root element')
}
createRoot(rootElement).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>,
)
