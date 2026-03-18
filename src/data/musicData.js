export const musicData = [
  { artist: "Kendrick Lamar", genre: "Hip Hop", playCount: 847, topTrack: "HUMBLE." },
  { artist: "Arctic Monkeys", genre: "Indie Rock", playCount: 623, topTrack: "R U Mine?" },
  { artist: "Miles Davis", genre: "Jazz", playCount: 412, topTrack: "So What" },
  { artist: "Daft Punk", genre: "Electronic", topTrack: "Get Lucky", playCount: 731 },
  { artist: "Frank Ocean", genre: "R&B", playCount: 559, topTrack: "Nights" },
  { artist: "Radiohead", genre: "Indie Rock", playCount: 388, topTrack: "Karma Police" },
  { artist: "Tyler the Creator", genre: "Hip Hop", playCount: 502, topTrack: "EARFQUAKE" },
  { artist: "Tame Impala", genre: "Electronic", playCount: 445, topTrack: "The Less I Know" },
]

export const genreColors = {
  "Hip Hop":    { neon: "#FFD700", emissive: "#FF8C00", hex: 0xFFD700 },
  "Jazz":       { neon: "#00BFFF", emissive: "#0066FF", hex: 0x00BFFF },
  "Electronic": { neon: "#00FFFF", emissive: "#00CCCC", hex: 0x00FFFF },
  "Indie Rock": { neon: "#FF6600", emissive: "#FF4400", hex: 0xFF6600 },
  "R&B":        { neon: "#CC44FF", emissive: "#9900CC", hex: 0xCC44FF },
}

// Group artists by genre and assign district positions
export function buildDistrictData(data) {
  const genreMap = {}
  data.forEach(item => {
    if (!genreMap[item.genre]) genreMap[item.genre] = []
    genreMap[item.genre].push(item)
  })

  // Lay out districts in a grid pattern
  const genres = Object.keys(genreMap)
  const districtPositions = [
    [-22, 0, -22],
    [ 22, 0, -22],
    [-22, 0,  22],
    [ 22, 0,  22],
    [  0, 0,   0],
  ]

  return genres.map((genre, i) => ({
    genre,
    color: genreColors[genre] || { neon: "#FFFFFF", emissive: "#AAAAAA", hex: 0xFFFFFF },
    center: districtPositions[i] || [i * 20, 0, 0],
    artists: genreMap[genre],
  }))
}
