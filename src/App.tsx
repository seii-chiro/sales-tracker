import { useEffect, useState } from 'react'
import './App.css'
import { supabase } from './supabaseClient'
import type { InventoryItem } from './types/inventory_items'

function App() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  useEffect(() => {
    const fetchInventoryItems = async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
      if (error) {
        console.error('Error fetching inventory items:', error)
      } else {
        setInventoryItems(data)
      }
    }
    fetchInventoryItems()
  }, [])

  console.log(inventoryItems)

  return (
    <div>
      <h1 className='text-red-600'>Vite + React</h1>
    </div>
  )
}

export default App
