declare module '*.geojson' {
  const value: {
    type: string
    features: Array<{
      type: string
      geometry: {
        type: string
        coordinates: number[][][] | number[][][][]
      }
      properties: Record<string, any>
    }>
  }
  export default value
}
