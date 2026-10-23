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

// Grados que componen la escala completa: I al VIII (índices 0 al 7)
const ESCALA_COMPLETA = [0, 1, 2, 3, 4, 5, 6, 7]

// Grados que componen el arpegio de la tónica: I, III, V, VIII (índices 0, 2, 4, 7)
const ARPEGIO_TONICA = [0, 2, 4, 7]

// Coordenadas verticales de posición 'top' para centrar el teclado según la tonalidad (0=FA a 11=MI)
const COORDS_TECLADO = [60, 73, 86, 99, 112, 125, 138, 164, 177, 190, 203, 216]

export function useAudioGrados() {
  // Gráfico actual del teclado (por defecto teclado.png)
  const imagenTeclado = ref('/images/teclado.png')
  const reproduciendo = ref(false)
  const gradosActivosSonando = ref([]) // Lista de grados (0..7) que están sonando en este momento

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
    gradosActivosSonando.value = [grado]
    const semitono = calcularSemitono(grado, tonicaSemitono, modo)
    tocarNota(semitono, verTeclado)
  }

  // Reproduce el acorde simultáneo de la tónica con el gráfico del teclado
  const reproducirAcordeTonica = async (tonicaSemitono, modo = 0, duracionMs = 1100) => {
    let numTonal = tonicaSemitono + 1
    if (modo > 0) {
      numTonal += 12
    }
    imagenTeclado.value = `/images/tonal${numTonal}.png`

    // Resaltar todos los grados del acorde simultáneamente (I, III, V, VIII)
    gradosActivosSonando.value = [...ARPEGIO_TONICA]

    // Tocar el acorde simultáneo (las 4 notas de la tónica al mismo tiempo)
    const audiosAcorde = ARPEGIO_TONICA.map(grado => {
      const semitono = calcularSemitono(grado, tonicaSemitono, modo)
      const archivo = listaArchivosSonido[semitono]
      const audio = new Audio('/audio/' + archivo)
      audio.play().catch(() => {})
      return audio
    })

    await new Promise(resolve => setTimeout(resolve, duracionMs))

    // Si la duración es corta, cortar el sonido antes del segundo golpe
    if (duracionMs < 800) {
      audiosAcorde.forEach(a => {
        try {
          a.pause()
          a.currentTime = 0
        } catch (e) {}
      })
    }

    imagenTeclado.value = '/images/teclado.png'
    gradosActivosSonando.value = []
  }

  // Fanfarria "ta-daa" triunfal al alcanzar la meta:
  // Dos acordes de tónica seguidos, el primero corto (ta) y el segundo resonante y prolongado (daaa)
  const reproducirTaDaa = async (tonicaSemitono, modo = 0) => {
    // 1. "Ta" corto
    await reproducirAcordeTonica(tonicaSemitono, modo, 120)
    // Breve silencio entre ambos
    await new Promise(resolve => setTimeout(resolve, 80))
    // 2. "Daa" resonante
    await reproducirAcordeTonica(tonicaSemitono, modo, 1200)
  }

  // 1. Al seleccionar una tonalidad: reproduce todos los grados de la escala (1 al 8) + acorde
  const oirEscalaTonalidad = async (tonicaSemitono, modo = 0) => {
    if (reproduciendo.value) return
    reproduciendo.value = true

    let semitonoAnterior = null

    for (const grado of ESCALA_COMPLETA) {
      if (semitonoAnterior !== null) {
        silenciarNota(semitonoAnterior)
      }

      const semitonoActual = calcularSemitono(grado, tonicaSemitono, modo)
      semitonoAnterior = semitonoActual

      tocarGrado(grado, tonicaSemitono, modo, true)
      await new Promise(resolve => setTimeout(resolve, 600))
    }

    if (semitonoAnterior !== null) {
      silenciarNota(semitonoAnterior)
    }

    await new Promise(resolve => setTimeout(resolve, 400))
    await reproducirAcordeTonica(tonicaSemitono, modo)

    reproduciendo.value = false
  }

  // 2. Al pulsar el botón "Oír Tonalidad": reproduce el arpegio (grados 1, 3, 5 y 8) + acorde
  const oirArpegioTonalidad = async (tonicaSemitono, modo = 0) => {
    if (reproduciendo.value) return
    reproduciendo.value = true

    let semitonoAnterior = null

    for (const grado of ARPEGIO_TONICA) {
      if (semitonoAnterior !== null) {
        silenciarNota(semitonoAnterior)
      }

      const semitonoActual = calcularSemitono(grado, tonicaSemitono, modo)
      semitonoAnterior = semitonoActual

      tocarGrado(grado, tonicaSemitono, modo, true)
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    if (semitonoAnterior !== null) {
      silenciarNota(semitonoAnterior)
    }

    await new Promise(resolve => setTimeout(resolve, 350))
    await reproducirAcordeTonica(tonicaSemitono, modo)

    reproduciendo.value = false
  }

  const resetTeclado = () => {
    imagenTeclado.value = '/images/teclado.png'
    gradosActivosSonando.value = []
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
    gradosActivosSonando,
    tocarNota,
    silenciarNota,
    tocarGrado,
    calcularSemitono,
    oirEscalaTonalidad,
    oirArpegioTonalidad,
    reproducirAcordeTonica,
    reproducirTaDaa,
    resetTeclado,
    obtenerTopTeclado
  }
}
