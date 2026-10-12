import { ref } from 'vue'

// Lista ordenada de los 24 archivos de sonido desde Fa3 hasta Mi5
const listaArchivosSonido = [
  'Fa3.mp3', 'Fas3.mp3', 'Sol3.mp3', 'Lab3.mp3', 'La3.mp3', 'Sib3.mp3', 'Si3.mp3',
  'Do4.mp3', 'Dos4.mp3', 'Re4.mp3', 'Mib4.mp3', 'Mi4.mp3', 'Fa4.mp3', 'Fas4.mp3',
  'Sol4.mp3', 'Lab4.mp3', 'La4.mp3', 'Sib4.mp3', 'Si4.mp3', 'Do5.mp3', 'Dos5.mp3',
  'Re5.mp3', 'Mib5.mp3', 'Mi5.mp3'
]

// Intervalos en semitonos para cada tipo de escala (grados I al VIII)
const ESCALAS = {
  0: [0, 2, 4, 5, 7, 9, 11, 12], // Mayor natural
  1: [0, 2, 3, 5, 7, 8, 11, 12], // Menor armónica
  2: [0, 2, 3, 5, 7, 8, 10, 12], // Menor natural
  3: [0, 2, 3, 5, 7, 9, 11, 12]  // Menor melódica
}

// Grados que componen el arpegio de la tónica: I, III, V, VIII (índices 0, 2, 4, 7)
const ARPEGIO = [0, 2, 4, 7]

// Coordenadas verticales de posición 'top' para centrar el teclado según la tonalidad (0=FA a 11=MI)
const COORDS_TECLADO = [60, 73, 86, 99, 112, 125, 138, 164, 177, 190, 203, 216]

export function useAudioGrados() {
  // Gráfico actual del teclado (por defecto teclado.png)
  const imagenTeclado = ref('/images/teclado.png')
  const reproduciendo = ref(false)
  const gradoActivoSonando = ref(null) // Grado (0..7) que está sonando en este momento

  // Cache para las instancias de Audio y evitar latencia
  const audioCache = new Map()

  const obtenerAudio = (nombreArchivo) => {
    if (!audioCache.has(nombreArchivo)) {
      const audio = new Audio('/audio/' + nombreArchivo)
      audioCache.set(nombreArchivo, audio)
    }
    return audioCache.get(nombreArchivo)
  }

  // Reproduce una nota dado su índice absoluto en la escala cromática (0 a 23)
  const tocarNota = (indiceSemitono, verTeclado = true) => {
    if (indiceSemitono < 0 || indiceSemitono >= listaArchivosSonido.length) return

    const archivo = listaArchivosSonido[indiceSemitono]
    const audio = obtenerAudio(archivo)

    try {
      audio.pause()
      audio.currentTime = 0
      audio.play().catch(() => {})
    } catch (e) {}

    if (verTeclado) {
      // tecla1.png corresponde al índice 0 (Fa3), tecla2 a Fas3, etc.
      imagenTeclado.value = `/images/tecla${indiceSemitono + 1}.png`
    }
  }

  // Detiene la nota actual y restablece el teclado
  const silenciarNota = (indiceSemitono) => {
    if (indiceSemitono >= 0 && indiceSemitono < listaArchivosSonido.length) {
      const archivo = listaArchivosSonido[indiceSemitono]
      const audio = obtenerAudio(archivo)
      try {
        audio.pause()
        audio.currentTime = 0
      } catch (e) {}
    }
    imagenTeclado.value = '/images/teclado.png'
  }

  // Calcula el índice semitono cromático dado un grado (0..7), la tónica (0..11) y el modo (0..3)
  const calcularSemitono = (grado, tonicaSemitono, modo = 0) => {
    const patron = ESCALAS[modo] || ESCALAS[0]
    const intervalo = patron[grado] !== undefined ? patron[grado] : 0
    return tonicaSemitono + intervalo
  }

  // Toca un grado específico (0 = I, 1 = II, ... 7 = VIII)
  const tocarGrado = (grado, tonicaSemitono, modo = 0, verTeclado = true) => {
    gradoActivoSonando.value = grado
    const semitono = calcularSemitono(grado, tonicaSemitono, modo)
    tocarNota(semitono, verTeclado)
  }

  // Reproduce el arpegio y acorde cadencial de la tonalidad seleccionada
  const oirTonalidadCompleta = async (tonicaSemitono, modo = 0) => {
    if (reproduciendo.value) return
    reproduciendo.value = true

    // Reproducción secuencial de las notas del arpegio (I, III, V, VIII)
    for (const grado of ARPEGIO) {
      tocarGrado(grado, tonicaSemitono, modo, true)
      await new Promise(resolve => setTimeout(resolve, 850))
    }

    // Calcula el número de gráfico para el acorde completo (tonal1 a tonal24)
    // 1..12 son mayores (FA a MI), 13..24 son menores
    let numTonal = tonicaSemitono + 1
    if (modo > 0) {
      numTonal += 12
    }
    imagenTeclado.value = `/images/tonal${numTonal}.png`

    // Tocar el acorde simultáneo (las 4 notas sonando al mismo tiempo)
    ARPEGIO.forEach(grado => {
      const semitono = calcularSemitono(grado, tonicaSemitono, modo)
      const archivo = listaArchivosSonido[semitono]
      const audio = new Audio('/audio/' + archivo) // nueva instancia para tocar simultáneamente
      audio.play().catch(() => {})
    })

    // Grado activo sonando para el acorde completo: ninguno en individual o resalta el I
    gradoActivoSonando.value = null

    // Mantener el acorde un segundo y volver al teclado base
    await new Promise(resolve => setTimeout(resolve, 1100))
    imagenTeclado.value = '/images/teclado.png'
    reproduciendo.value = false
  }

  const resetTeclado = () => {
    imagenTeclado.value = '/images/teclado.png'
    gradoActivoSonando.value = null
  }

  // Obtiene la posición 'top' del teclado para centrarlo según la tonalidad
  const obtenerTopTeclado = (tonicaSemitono) => {
    if (tonicaSemitono >= 0 && tonicaSemitono < COORDS_TECLADO.length) {
      return COORDS_TECLADO[tonicaSemitono]
    }
    return 190
  }

  return {
    imagenTeclado,
    reproduciendo,
    gradoActivoSonando,
    tocarNota,
    silenciarNota,
    tocarGrado,
    calcularSemitono,
    oirTonalidadCompleta,
    resetTeclado,
    obtenerTopTeclado
  }
}
