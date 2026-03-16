
import './App.css'
import { createBrowserRouter, RouterProvider } from "react-router"
import Sales from './pages/Sales'
import Inventory from './pages/Inventory'
import Home from './pages/Home'
import RootLayout from './layouts/RootLayout'

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "inventory",
        element: <Inventory />
      },
      {
        path: "sales",
        element: <Sales />
      }
    ]
  }
])

function App() {


  return <RouterProvider router={router} />
}

export default App
