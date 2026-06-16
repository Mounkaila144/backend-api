'use client'

import { useMemo, useEffect, useRef } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import type { TourGroup } from '../../../types'

const GROUP_COLORS = ['#2196f3', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#795548', '#607d8b', '#e91e63', '#3f51b5']

interface TourMapProps {
  groups: TourGroup[]
  highlightedGroupId?: number | null
  mapboxToken?: string
}

const TourMap = ({ groups, highlightedGroupId, mapboxToken }: TourMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  // Collect all coordinates for bounds
  const allCoords = useMemo(() => {
    const coords: Array<{ lat: number; lng: number; groupIdx: number; name: string; order: number }> = []
    groups.forEach((group, groupIdx) => {
      group.meetings.forEach(m => {
        if (m.lat && m.lng) {
          coords.push({ lat: m.lat, lng: m.lng, groupIdx, name: m.customer_name, order: m.order_in_group })
        }
      })
    })
    return coords
  }, [groups])

  useEffect(() => {
    if (!mapContainerRef.current || allCoords.length === 0) return

    // Dynamic import mapbox-gl to avoid SSR issues
    import('mapbox-gl').then(mapboxgl => {
      const mbgl = mapboxgl.default || mapboxgl

      const token = mapboxToken || ''
      if (!token) {
        console.warn('Mapbox token not configured in tour settings')
        return
      }

      mbgl.accessToken = token

      if (mapRef.current) {
        mapRef.current.remove()
      }

      const map = new mbgl.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [allCoords[0].lng, allCoords[0].lat],
        zoom: 8,
      })

      mapRef.current = map

      map.on('load', () => {
        // Clear old markers
        markersRef.current.forEach(m => m.remove())
        markersRef.current = []

        // Add markers
        allCoords.forEach(coord => {
          const color = GROUP_COLORS[coord.groupIdx % GROUP_COLORS.length]
          const el = document.createElement('div')
          el.style.width = '24px'
          el.style.height = '24px'
          el.style.borderRadius = '50%'
          el.style.backgroundColor = color
          el.style.border = '2px solid #fff'
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
          el.style.display = 'flex'
          el.style.alignItems = 'center'
          el.style.justifyContent = 'center'
          el.style.color = '#fff'
          el.style.fontSize = '10px'
          el.style.fontWeight = '700'
          el.textContent = String(coord.order + 1)
          el.title = coord.name

          const marker = new mbgl.Marker({ element: el })
            .setLngLat([coord.lng, coord.lat])
            .setPopup(new mbgl.Popup({ offset: 15 }).setText(coord.name))
            .addTo(map)

          markersRef.current.push(marker)
        })

        // Add route lines for each group
        groups.forEach((group, groupIdx) => {
          const coords = group.meetings
            .filter(m => m.lat && m.lng)
            .sort((a, b) => a.order_in_group - b.order_in_group)
            .map(m => [m.lng!, m.lat!])

          if (coords.length < 2) return

          const sourceId = `route-${group.id}`
          const color = GROUP_COLORS[groupIdx % GROUP_COLORS.length]

          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: coords },
            },
          })

          map.addLayer({
            id: `route-line-${group.id}`,
            type: 'line',
            source: sourceId,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': color,
              'line-width': 3,
              'line-opacity': 0.7,
              'line-dasharray': [2, 1],
            },
          })
        })

        // Fit bounds
        if (allCoords.length > 0) {
          const bounds = new mbgl.LngLatBounds()
          allCoords.forEach(c => bounds.extend([c.lng, c.lat]))
          map.fitBounds(bounds, { padding: 50, maxZoom: 13 })
        }
      })
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [allCoords, groups])

  // Handle highlighted group
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    groups.forEach((group) => {
      const layerId = `route-line-${group.id}`
      if (!map.getLayer(layerId)) return

      const isHighlighted = highlightedGroupId === null || highlightedGroupId === group.id
      map.setPaintProperty(layerId, 'line-opacity', isHighlighted ? 0.8 : 0.2)
      map.setPaintProperty(layerId, 'line-width', highlightedGroupId === group.id ? 5 : 3)
    })
  }, [highlightedGroupId, groups])

  if (allCoords.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
        <Typography variant="body2">Aucune coordonnee GPS disponible</Typography>
      </Box>
    )
  }

  return <Box ref={mapContainerRef} sx={{ width: '100%', height: '100%', borderRadius: 2, overflow: 'hidden' }} />
}

export default TourMap
