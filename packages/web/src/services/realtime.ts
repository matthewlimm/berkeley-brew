import { supabase } from '@/lib/supabase'
import type { Database } from '@berkeley-brew/api/src/db'

type RealtimeData = Database['public']['Tables']['cafes_realtime_data']['Row']

export async function getRealtimeData(cafeId: string) {
    const { data: mostRecent, error } = await supabase
        .from('cafes_realtime_data')
        .select('*')
        .eq('cafe_id', cafeId)
        .order('created_at', { ascending: false })
        .limit(3)

    if (error) {
        console.error('Error fetching realtime data:', error)
        return null
    }

    // Debug the data structure
    console.log('Realtime data:', mostRecent)

    const result = {
        wifi_availability: [] as RealtimeData[],
        outlet_availability: [] as RealtimeData[],
        seating: [] as RealtimeData[]
    }

    mostRecent?.forEach((item) => {
        // Debug each item
        console.log('Processing item:', item)

        switch (item.type) {
            case 'wifi_availability':
                result.wifi_availability.push(item)
                break
            case 'outlet_availability':
                result.outlet_availability.push(item)
                break
            case 'seating':
                result.seating.push(item)
                break
        }
    })

    return result
} 