export const musicData = [
  // Hip Hop
  { artist: "Kendrick Lamar", genre: "Hip Hop", playCount: 847, topTrack: "HUMBLE." },
  { artist: "Tyler the Creator", genre: "Hip Hop", playCount: 502, topTrack: "EARFQUAKE" },
  { artist: "Drake", genre: "Hip Hop", playCount: 920, topTrack: "God's Plan" },
  { artist: "J. Cole", genre: "Hip Hop", playCount: 678, topTrack: "No Role Modelz" },
  { artist: "Travis Scott", genre: "Hip Hop", playCount: 743, topTrack: "SICKO MODE" },
  { artist: "Kanye West", genre: "Hip Hop", playCount: 810, topTrack: "Runaway" },

  // Electronic
  { artist: "Daft Punk", genre: "Electronic", topTrack: "Get Lucky", playCount: 731 },
  { artist: "Tame Impala", genre: "Electronic", playCount: 445, topTrack: "The Less I Know" },
  { artist: "The Chemical Brothers", genre: "Electronic", playCount: 398, topTrack: "Block Rockin Beats" },
  { artist: "Aphex Twin", genre: "Electronic", playCount: 334, topTrack: "Windowlicker" },
  { artist: "Caribou", genre: "Electronic", playCount: 289, topTrack: "Can't Do Without You" },

  // Indie Rock
  { artist: "Arctic Monkeys", genre: "Indie Rock", playCount: 623, topTrack: "R U Mine?" },
  { artist: "Radiohead", genre: "Indie Rock", playCount: 388, topTrack: "Karma Police" },
  { artist: "The Strokes", genre: "Indie Rock", playCount: 567, topTrack: "Last Nite" },
  { artist: "Vampire Weekend", genre: "Indie Rock", playCount: 412, topTrack: "A-Punk" },
  { artist: "Mac DeMarco", genre: "Indie Rock", playCount: 378, topTrack: "Salad Days" },

  // Jazz
  { artist: "Miles Davis", genre: "Jazz", playCount: 412, topTrack: "So What" },
  { artist: "John Coltrane", genre: "Jazz", playCount: 445, topTrack: "A Love Supreme" },
  { artist: "Thelonious Monk", genre: "Jazz", playCount: 312, topTrack: "Round Midnight" },
  { artist: "Herbie Hancock", genre: "Jazz", playCount: 289, topTrack: "Cantaloupe Island" },

  // R&B
  { artist: "Frank Ocean", genre: "R&B", playCount: 559, topTrack: "Nights" },
  { artist: "The Weeknd", genre: "R&B", playCount: 890, topTrack: "Blinding Lights" },
  { artist: "SZA", genre: "R&B", playCount: 634, topTrack: "Kill Bill" },
  { artist: "Daniel Caesar", genre: "R&B", playCount: 478, topTrack: "Best Part" },

  // Pop
  { artist: "Billie Eilish", genre: "Pop", playCount: 756, topTrack: "bad guy" },
  { artist: "Harry Styles", genre: "Pop", playCount: 623, topTrack: "Watermelon Sugar" },
  { artist: "Lana Del Rey", genre: "Pop", playCount: 834, topTrack: "Summertime Sadness" },
  { artist: "Olivia Rodrigo", genre: "Pop", playCount: 589, topTrack: "drivers license" },
]

export const genreColors = {
  "Hip Hop":    { neon: "#FFD700", emissive: "#FF8C00", base: "#1a1200" },
  "Jazz":       { neon: "#4488FF", emissive: "#0044CC", base: "#000a1a" },
  "Electronic": { neon: "#00FFFF", emissive: "#00AACC", base: "#001a1a" },
  "Indie Rock": { neon: "#FF6622", emissive: "#CC3300", base: "#1a0800" },
  "R&B":        { neon: "#CC44FF", emissive: "#8800CC", base: "#0f001a" },
  "Pop":        { neon: "#FF3388", emissive: "#CC0055", base: "#1a000a" },
}

export const MAX_PLAY = 920

export function buildDistrictData(data) {
  const genreMap = {}
  data.forEach(item => {
    if (!genreMap[item.genre]) genreMap[item.genre] = []
    genreMap[item.genre].push(item)
  })

  const genres = Object.keys(genreMap)
  // 2x3 grid layout
  const districtPositions = [
    [-44, 0, -32],  // Hip Hop
    [  0, 0, -35],  // Electronic
    [ 44, 0, -28],  // Indie Rock
    [-40, 0,  30],  // Jazz
    [  4, 0,  28],  // R&B
    [ 46, 0,  32],  // Pop
  ]

  return genres.map((genre, i) => ({
    genre,
    color: genreColors[genre] || { neon: "#FFFFFF", emissive: "#AAAAAA", base: "#0a0a0a" },
    center: districtPositions[i] || [(i - 2.5) * 40, 0, 0],
    artists: genreMap[genre],
  }))
}
