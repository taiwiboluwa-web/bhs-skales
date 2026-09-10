import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://efogrjhuqyzvgrahobto.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmb2dyamh1cXl6dmdyYWhvYnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Mzk2NDYsImV4cCI6MjEwMTAxNTY0Nn0.ig8HKUiqGSExaQZcLsVbVti1m1XjhJyKNBpl7sJZkNI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const STORAGE_BUCKET = 'product-images'

export type Category = 'Jewelry' | 'Bags' | 'Shoes' | 'Shades' | 'Clothing'

export type Product = {
  id: string
  name: string
  category: Category
  price: number
  discount_percent: number
  origin: string
  description: string
  images: string[]
  status: string
  is_latest_arrival: boolean
  created_at: string
  updated_at: string
}

export function getSalePrice(price: number, discount: number): number {
  if (!discount || discount <= 0) return price
  return Math.round(price * (1 - discount / 100))
}

export const CATEGORIES: Category[] = ['Jewelry', 'Bags', 'Shoes', 'Shades', 'Clothing']

export function getImageUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
}
