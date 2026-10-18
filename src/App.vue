<script setup>
import { ref, computed } from 'vue'
import { useAudioGrados } from './composables/useAudioGrados'

// Inicializar composable de audio y gráficos del teclado
const {
  imagenTeclado,
  reproduciendo,
  gradosActivosSonando,
  tocarNota,
  tocarGrado,
  silenciarNota,
  calcularSemitono,
  oirEscalaTonalidad,
  oirArpegioTonalidad,
  resetTeclado,
  obtenerTopTeclado
} = useAudioGrados()

// Estado del flujo de portada / registro:
// 'portada' -> pantalla inicial con créditos y botón REGISTRARSE
// 'registro' -> inputs para nombre y código con botón ENTRAR
// 'juego' -> portada cerrada, pantalla de juego activa
const fase = ref('portada')

const nombreUsuario = ref('')
const codigoUsuario = ref('')
const errorNombre = ref(false)
const errorCodigo = ref(false)

// Configuración del juego (Reactiva)
const pasoConfig = ref('serie') // 'serie' -> 'meta' -> 'modo' -> 'tonalidad' -> 'listo'
const encabezadoTexto = ref('')

// Audio de máquina / teclado para la animación
let audioTeclado = null
const reproducirSonidoTeclado = () => {
  try {
    if (!audioTeclado) {
      audioTeclado = new Audio('/audio/TecladoCompu.mp3')
    }
    audioTeclado.currentTime = 0
    audioTeclado.play().catch(() => {})
  } catch (e) {}
}

const detenerSonidoTeclado = () => {
  if (audioTeclado) {
    try {
      audioTeclado.pause()
      audioTeclado.currentTime = 0
    } catch (e) {}
  }
}

// Animación de texto tipo máquina de escribir de derecha a izquierda (de la última letra a la primera)
let intervaloTexto = null
const animarTextoReverso = (textoCompleto, velocidad = 30) => {
  if (intervaloTexto) clearInterval(intervaloTexto)
  encabezadoTexto.value = ''
  
  const len = textoCompleto.length
  let index = len - 1

  intervaloTexto = setInterval(() => {
    if (index >= 0) {
      // Va descubriendo el texto desde la posición index hasta el final
      encabezadoTexto.value = textoCompleto.slice(index)
      index--
    } else {
      clearInterval(intervaloTexto)
      intervaloTexto = null
      detenerSonidoTeclado()
    }
  }, velocidad)
}

const cambiarInstruccion = (nuevoTexto) => {
  animarTextoReverso(nuevoTexto, 30)
}

// Posición dinámica del encabezado según el paso (reubicación según gradosWeb.js original)
// En paso 'serie': top: 42px, left: 10px
// En paso 'meta': top: 70px, left: 5px
// En paso 'modo': top: 223px, left: 0px
// En paso 'tonalidad': top: 338px, left: 20px
// En paso 'listo': top: 460px, left: 500px ("Haz click en Nuevo sonido")
const estiloEncabezado = computed(() => {
  switch (pasoConfig.value) {
    case 'meta':
      return { top: '70px', left: '5px' }
    case 'modo':
      return { top: '223px', left: '0px' }
    case 'tonalidad':
      return { top: '338px', left: '20px' }
    case 'listo':
      return { top: '460px', left: '500px' }
    case 'serie':
    default:
      return { top: '42px', left: '10px' }
  }
})
const serieActivada = ref(true)
const metaActivada = ref(false)
const modoActivado = ref(false)
const tonalidadActivada = ref(false)

// 1. Tamaño de serie (1..10)
const serieSeleccionada = ref(null) // Al iniciar el juego, ningún tamaño de serie está seleccionado
const series = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const idsSerie = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez']

// 2. Metas (3..20)
const metaSeleccionada = ref(null)
const metas = Array.from({ length: 18 }, (_, i) => i + 3) // [3, 4, ..., 20]

// 3. Modos / Clase de escala
const modoSeleccionado = ref(null)
const modos = [
  { id: 0, nombre: 'Mayor natural' },
  { id: 1, nombre: 'Menor armónica' },
  { id: 2, nombre: 'Menor natural' },
  { id: 3, nombre: 'Menor melódica' }
]

// 4. Tonalidades
const tonalidadSeleccionada = ref(null)
const tonicaSemitonoActual = ref(7) // Por defecto DO (semitono 7)
const topTeclado = computed(() => {
  return obtenerTopTeclado(tonicaSemitonoActual.value)
})
const tonalidades = [
  { id: 'MI', nombreMayor: 'MI', nombreMenor: 'mi', semitono: 11 },
  { id: 'MIb', nombreMayor: 'MIb', nombreMenor: 're#/mib', semitono: 10 },
  { id: 'RE', nombreMayor: 'RE', nombreMenor: 're', semitono: 9 },
  { id: 'DOs', nombreMayor: 'DO#/REb', nombreMenor: 'do#', semitono: 8 },
  { id: 'DO', nombreMayor: 'DO', nombreMenor: 'do', semitono: 7 },
  { id: 'SI', nombreMayor: 'SI/DOb', nombreMenor: 'si', semitono: 6 },
  { id: 'SIb', nombreMayor: 'SIb', nombreMenor: 'la#/sib', semitono: 5 },
  { id: 'LA', nombreMayor: 'LA', nombreMenor: 'la', semitono: 4 },
  { id: 'LAb', nombreMayor: 'LAb', nombreMenor: 'sol#/lab', semitono: 3 },
  { id: 'SOL', nombreMayor: 'SOL', nombreMenor: 'sol', semitono: 2 },
  { id: 'FAs', nombreMayor: 'FA#/SOLb', nombreMenor: 'fa#', semitono: 1 },
  { id: 'FA', nombreMayor: 'FA', nombreMenor: 'fa', semitono: 0 }
]

// Marcadores
const aciertos = ref(0)
const fallos = ref(0)
const reloj = ref('0:00:00.00')

// Estado del juego / ejercicio
const juegoIniciado = ref(false) // Se activa al pulsar 'Nuevo ejercicio / Nuevo sonido'
const ejercicioActivo = ref(false)
const listaGradosEjercicio = ref([]) // Grados generados al azar (0..7)
const gradopPosiciones = ref([]) // Objetos { visible: bool, left: number, top: number } por columna

// Bolsa persistente de grados disponibles (0..7 correspondientes a los grados I al VIII).
// Se mantiene a lo largo de los ejercicios para garantizar que el usuario recorra la escala
// completa sin repeticiones antes de volver a recargarse.
const bolsaGradosPersistente = ref([0, 1, 2, 3, 4, 5, 6, 7])

// Dial de columna que señala el sonido actual (sombraGradop)
const columnaActivaDial = ref(null) // null cuando no está sonando nada, o índice 0..9 según la columna que suena
const estiloSombraGradop = computed(() => {
  if (columnaActivaDial.value === null) {
    return { display: 'none' }
  }
  return {
    display: 'inline',
    left: `${490 + columnaActivaDial.value * 39}px`
  }
})

// El tablero y paneles de ajuste se consideran bloqueados cuando el juego ha iniciado
// y el usuario aún no ha alcanzado la meta
const panelesAjusteBloqueados = computed(() => {
  if (!juegoIniciado.value) return false
  if (metaSeleccionada.value && aciertos.value >= metaSeleccionada.value) {
    return false // Se desbloquean al llegar a la meta
  }
  return true
})

// Textos de los botones según el tamaño de la serie
const textoNuevoBoton = computed(() => {
  return serieSeleccionada.value === 1 ? 'Nuevo sonido' : 'Nueva serie'
})

const textoRepetirBoton = computed(() => {
  return serieSeleccionada.value === 1 ? 'Repetir sonido' : 'Repetir serie'
})

// Funciones de selección por paso
const seleccionarSerie = (num) => {
  if (!serieActivada.value || panelesAjusteBloqueados.value) return
  serieSeleccionada.value = num
  metaActivada.value = true

  // Si aún no se ha configurado la tonalidad, avanzamos en la guía inicial
  if (pasoConfig.value !== 'listo') {
    pasoConfig.value = 'meta'
    cambiarInstruccion('Selecciona un número en Meta')
    reproducirSonidoTeclado()
  } else {
    cambiarInstruccion('Haz clic en Nuevo sonido para iniciar')
  }
}

const seleccionarMeta = (num) => {
  if (!metaActivada.value || panelesAjusteBloqueados.value) return
  metaSeleccionada.value = num
  modoActivado.value = true

  if (pasoConfig.value !== 'listo') {
    pasoConfig.value = 'modo'
    cambiarInstruccion('Selecciona una Clase de escala')
    reproducirSonidoTeclado()
  } else {
    cambiarInstruccion('Haz clic en Nuevo sonido para iniciar')
  }
}

const seleccionarModo = (modo) => {
  if (!modoActivado.value || panelesAjusteBloqueados.value) return
  modoSeleccionado.value = modo.id
  tonalidadActivada.value = true

  if (pasoConfig.value !== 'listo') {
    pasoConfig.value = 'tonalidad'
    cambiarInstruccion('Selecciona una tonalidad')
    reproducirSonidoTeclado()
  } else {
    cambiarInstruccion('Haz clic en Nuevo sonido para iniciar')
  }
}

const seleccionarTonalidad = (tonalidad) => {
  if (!tonalidadActivada.value || reproduciendo.value || panelesAjusteBloqueados.value) return
  tonalidadSeleccionada.value = tonalidad.id
  tonicaSemitonoActual.value = tonalidad.semitono
  pasoConfig.value = 'listo'
  cambiarInstruccion('Haz clic en Nuevo sonido para iniciar')

  // Al seleccionar la tonalidad: toca todos los grados de la escala (1 al 8) + acorde
  const modoActual = modoSeleccionado.value !== null ? modoSeleccionado.value : 0
  oirEscalaTonalidad(tonalidad.semitono, modoActual)
}

// Botón Oír Tonalidad
const manejarOirTonalidad = () => {
  if (tonalidadSeleccionada.value === null || reproduciendo.value) return
  // Al pulsar Oír Tonalidad: toca el arpegio (1, 3, 5, 8) + acorde
  const modoActual = modoSeleccionado.value !== null ? modoSeleccionado.value : 0
  oirArpegioTonalidad(tonicaSemitonoActual.value, modoActual)
}

// Función para generar un ejercicio al azar extrayendo de la bolsa persistente
const generarEjercicio = () => {
  const tamSerie = serieSeleccionada.value || 1
  const nuevaLista = []

  for (let i = 0; i < tamSerie; i++) {
    // Si la bolsa se agota, se recarga con una escala completa de 8 grados (0 a 7)
    if (bolsaGradosPersistente.value.length === 0) {
      bolsaGradosPersistente.value = [0, 1, 2, 3, 4, 5, 6, 7]
    }
    const idx = Math.floor(Math.random() * bolsaGradosPersistente.value.length)
    const [gradoSeleccionado] = bolsaGradosPersistente.value.splice(idx, 1)
    nuevaLista.push(gradoSeleccionado)
  }
  return nuevaLista
}

// Reproducción secuencial de los sonidos del ejercicio y aparición de gradop
const tocarEjercicio = async (nuevaSecuencia = false) => {
  if (reproduciendo.value) return
  if (nuevaSecuencia) {
    listaGradosEjercicio.value = generarEjercicio()
  }
  if (!listaGradosEjercicio.value.length) return

  reproduciendo.value = true
  ejercicioActivo.value = true

  // Si es un nuevo sonido/serie, reiniciar posiciones
  if (nuevaSecuencia) {
    gradopPosiciones.value = Array.from({ length: 10 }, (_, i) => ({
      visible: false,
      left: 490 + i * 39,
      top: 145
    }))
  }

  const modoActual = modoSeleccionado.value !== null ? modoSeleccionado.value : 0
  let semitonoAnterior = null

  // Tocar secuencialmente cada grado del ejercicio
  for (let i = 0; i < listaGradosEjercicio.value.length; i++) {
    const grado = listaGradosEjercicio.value[i]

    if (semitonoAnterior !== null) {
      silenciarNota(semitonoAnterior)
    }

    const semitono = calcularSemitono(grado, tonicaSemitonoActual.value, modoActual)
    semitonoAnterior = semitono

    // Posicionar dial de columna (sombraGradop) en la columna actual
    columnaActivaDial.value = i

    // Hacer visible el signo de interrogación (gradop) sobre su columna
    if (gradopPosiciones.value[i]) {
      gradopPosiciones.value[i].visible = true
    }

    // Tocar el sonido del grado sin mostrar la tecla del piano ni el grado azul
    tocarNota(semitono, false)

    await new Promise(resolve => setTimeout(resolve, 850))
  }

  // Ocultar dial sombraGradop al terminar de sonar
  columnaActivaDial.value = null

  if (semitonoAnterior !== null) {
    silenciarNota(semitonoAnterior)
  }

  reproduciendo.value = false

  const mensaje = listaGradosEjercicio.value.length === 1
    ? 'Ubica el sonido ? frente a un grado'
    : 'Ubica cada sonido ? frente a un grado'
  cambiarInstruccion(mensaje)
}

const manejarNuevoSonido = () => {
  if (pasoConfig.value !== 'listo' || reproduciendo.value) return
  juegoIniciado.value = true
  tocarEjercicio(true)
}

const manejarRepetirSonido = () => {
  if (pasoConfig.value !== 'listo' || reproduciendo.value || !listaGradosEjercicio.value.length) return
  tocarEjercicio(false)
}

// Función para reiniciar el tablero y el estado de juego
const reiniciarTablero = () => {
  if (reproduciendo.value) return
  columnaActivaDial.value = null
  juegoIniciado.value = false
  ejercicioActivo.value = false
  listaGradosEjercicio.value = []
  gradopPosiciones.value = Array.from({ length: 10 }, (_, i) => ({
    visible: false,
    left: 490 + i * 39,
    top: 145
  }))
  aciertos.value = 0
  fallos.value = 0
  resetTeclado()

  // Esconder paneles de Meta, Modo y Tonalidad como al inicio
  pasoConfig.value = 'serie'
  serieActivada.value = true
  metaActivada.value = false
  modoActivado.value = false
  tonalidadActivada.value = false

  // Reiniciar selecciones
  serieSeleccionada.value = null
  metaSeleccionada.value = null
  modoSeleccionado.value = null
  tonalidadSeleccionada.value = null

  // Reiniciar ciclo de instrucciones y sonido de tecleo
  cambiarInstruccion('Selecciona el tamaño de la serie')
  reproducirSonidoTeclado()
}

// Hover sobre los grados 1 al 8 (para escuchar la nota y verla en el teclado)
const hoverGrado = (indiceGrado) => {
  if (reproduciendo.value || ejercicioActivo.value) return // Bloqueados durante el ejercicio
  // Grado 0 = grado 1, Grado 7 = grado 8
  const modoActual = modoSeleccionado.value !== null ? modoSeleccionado.value : 0
  tocarGrado(indiceGrado, tonicaSemitonoActual.value, modoActual, true)
}

const salirGrado = (indiceGrado) => {
  if (reproduciendo.value || ejercicioActivo.value) return
  const modoActual = modoSeleccionado.value !== null ? modoSeleccionado.value : 0
  const semitono = calcularSemitono(indiceGrado, tonicaSemitonoActual.value, modoActual)
  silenciarNota(semitono)
  gradosActivosSonando.value = []
}

// Fecha formateada (equivalente a formatoFecha de datosGW.js)
const formatearFecha = () => {
  const d = new Date()
  const nomMes = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
  const nomDias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"]
  return `${nomDias[d.getDay()]}, ${d.getDate()} de ${nomMes[d.getMonth()]} de ${d.getFullYear()}`
}

const fechaRegistro = ref('')

const iniciarRegistro = () => {
  fase.value = 'registro'
}

const entrarAlJuego = () => {
  errorNombre.value = !nombreUsuario.value.trim()
  errorCodigo.value = !codigoUsuario.value.toString().trim()

  if (errorNombre.value || errorCodigo.value) {
    return
  }

  fechaRegistro.value = formatearFecha()
  fase.value = 'juego'
  pasoConfig.value = 'serie'
  serieActivada.value = true
  metaActivada.value = false
  modoActivado.value = false
  tonalidadActivada.value = false
  serieSeleccionada.value = null
  metaSeleccionada.value = null
  modoSeleccionado.value = null
  tonalidadSeleccionada.value = null
  juegoIniciado.value = false
  ejercicioActivo.value = false
  listaGradosEjercicio.value = []
  aciertos.value = 0
  fallos.value = 0
  gradopPosiciones.value = Array.from({ length: 10 }, (_, i) => ({
    visible: false,
    left: 490 + i * 39,
    top: 145
  }))
  cambiarInstruccion('Selecciona el tamaño de la serie')
  reproducirSonidoTeclado()
}
</script>

<template>
  <div id="pantprinc"> 
        <img id="baseGrados" src="/images/baseGrados.png">
        <img 
          v-for="g in 8" 
          :key="'grado-base-' + g"
          class="grado" 
          :id="'grado' + g" 
          :src="'/images/grado' + g + '.png'"
          :class="{
            'grado-activo': gradosActivosSonando.includes(g - 1),
            'grados-visibles': tonalidadSeleccionada !== null,
            'bloqueado': reproduciendo || ejercicioActivo
          }"
          @mouseenter="hoverGrado(g - 1)"
          @mouseleave="salirGrado(g - 1)"
        >

        <img id="fondoTeclado" src="/images/fondoTeclado.png">
        <img id="teclado" :src="imagenTeclado" :style="{ top: topTeclado + 'px' }">
        <img id="maskTeclado" src="/images/maskTeclado.png">
        
        <img id="fondosupA" src="/images/fondosupA.png">
        <img id="fondosupB" src="/images/fondosupB.png">
        <img id="fondoinfA" src="/images/fondoinfA.png">
        <img id="fondoinfB" src="/images/fondoinfB.png">

        <div id="reloj">{{ reloj }}</div>

        <div id="encabezado" :style="estiloEncabezado">{{ encabezadoTexto }}</div>
        <div id="nomUser">Nombre: {{ nombreUsuario }}</div>
        <div id="fecha">{{ fechaRegistro }}</div>

        <img id="titdat" src="/images/titulodatos.png">
        <div class="des" id="des1"></div>
        <div class="des" id="des2"></div>
        <div class="des" id="des3"></div>
        <div class="des" id="des4"></div>
        <div class="des" id="des5"></div>
        <div class="des" id="des6"></div>
        <div class="des" id="des7"></div>

        <!-- Tonalidades -->
        <template v-if="tonalidadActivada">
          <div id="titulo" class="activo panel-fade-in" :class="{ 'panel-bloqueado': panelesAjusteBloqueados }">Tonalidad</div>
          <div id="marcoTonalidades" class="activo panel-fade-in" :class="{ 'panel-bloqueado': panelesAjusteBloqueados }"></div>
          <div 
            v-for="ton in tonalidades" 
            :key="ton.id" 
            class="tonal panel-fade-in" 
            :id="ton.id"
            :class="{ 
              seleccionado: tonalidadSeleccionada === ton.id,
              bloqueado: reproduciendo || panelesAjusteBloqueados
            }"
            @click="seleccionarTonalidad(ton)"
          >{{ modoSeleccionado === 0 || modoSeleccionado === null ? ton.nombreMayor : ton.nombreMenor }}</div>
        </template>

        <!-- Meta -->
        <template v-if="metaActivada">
          <div id="meta" class="activo panel-fade-in" :class="{ 'panel-bloqueado': panelesAjusteBloqueados }">Meta</div>
          <div id="marcoMeta" class="activo panel-fade-in" :class="{ 'panel-bloqueado': panelesAjusteBloqueados }"></div>
          <div 
            v-for="(m, idx) in metas" 
            :key="m" 
            class="meta panel-fade-in" 
            :id="'meta' + (idx + 1)"
            :class="{ 
              seleccionado: metaSeleccionada === m,
              bloqueado: panelesAjusteBloqueados
            }"
            @click="seleccionarMeta(m)"
          >{{ m }}</div>
        </template>
        
        <!-- Clase de escala / Modos -->
        <template v-if="modoActivado">
          <div id="tituloModos" class="activo panel-fade-in" :class="{ 'panel-bloqueado': panelesAjusteBloqueados }">Clase de escala</div>
          <div id="marcoModos" class="activo panel-fade-in" :class="{ 'panel-bloqueado': panelesAjusteBloqueados }"></div>
          <div 
            v-for="m in modos" 
            :key="m.id" 
            class="modo panel-fade-in" 
            :id="'modo' + (m.id + 1)"
            :class="{ 
              seleccionado: modoSeleccionado === m.id,
              bloqueado: panelesAjusteBloqueados
            }"
            @click="seleccionarModo(m)"
          >{{ m.nombre }}</div>
        </template>

        <div 
          v-if="pasoConfig === 'listo'" 
          id="nuevosonido" 
          class="activo panel-fade-in"
          :class="{ bloqueado: reproduciendo }"
          @click="manejarNuevoSonido"
        >{{ textoNuevoBoton }}</div>

        <div 
          v-if="pasoConfig === 'listo'" 
          id="repetirsonido" 
          class="activo panel-fade-in"
          :class="{ bloqueado: reproduciendo || !listaGradosEjercicio.length }"
          @click="manejarRepetirSonido"
        >{{ textoRepetirBoton }}</div>
       
        <div 
          v-if="tonalidadSeleccionada !== null"
          id="oirtonalidad" 
          class="activo panel-fade-in"
          :class="{ bloqueado: reproduciendo }"
          @click="manejarOirTonalidad"
        >Oir tonalidad</div>

        <div 
          v-if="juegoIniciado"
          id="reiniciar" 
          class="activo panel-fade-in"
          :class="{ bloqueado: reproduciendo }"
          @click="reiniciarTablero"
        >Reiniciar</div>

        <div 
          id="marcador1" 
          :class="{ 'activo-aciertos': metaSeleccionada !== null || juegoIniciado }"
        >{{ aciertos }}</div>
        <div 
          id="marcador2"
          :class="{ 'activo-fallos': metaSeleccionada !== null || juegoIniciado }"
        >{{ fallos }}</div>

        <!-- Marcas de columna activas según la serie seleccionada -->
        <img 
          v-for="n in 10" 
          :key="'marca-' + n" 
          class="marca" 
          :id="'marcaColumna' + n" 
          src="/images/path4140.png"
          :class="{ visible: n <= serieSeleccionada }"
        >

        <!-- Tamaño de Serie -->
        <div 
          id="tituloSerie" 
          :class="{ activo: serieActivada, 'panel-bloqueado': panelesAjusteBloqueados }"
        >Tamaño de la serie:</div>
        <div 
          v-for="(num, idx) in series" 
          :key="num" 
          class="numserie" 
          :id="idsSerie[idx]"
          :class="{ 
            seleccionado: num <= serieSeleccionada,
            bloqueado: panelesAjusteBloqueados,
            disponible: true
          }"
          @click="seleccionarSerie(num)"
        >{{ num }}</div>

        <img class="sgp" id="sombraGrado1" src="/images/dialAzul.png">
        <img class="sgp" id="sombraGrado2" src="/images/dialAzul.png">
        <img class="sgp" id="sombraGrado3" src="/images/dialAzul.png">
        <img class="sgp" id="sombraGrado4" src="/images/dialAzul.png">
        <img class="sgp" id="sombraGrado5" src="/images/dialAzul.png">
        <img class="sgp" id="sombraGrado6" src="/images/dialAzul.png">
        <img class="sgp" id="sombraGrado7" src="/images/dialAzul.png">
        <img class="sgp" id="sombraGrado8" src="/images/dialAzul.png">
        <img class="sgp" id="sombraGrado9" src="/images/dialAzul.png">
        <img class="sgp" id="sombraGrado10" src="/images/dialAzul.png">
        <img id="sombraGradop" src="/images/sombraGradop.png" :style="estiloSombraGradop">

        <!-- Grados / Círculos punteados por columna (g1..g10) -->
        <template v-for="col in 10" :key="'col-' + col">
          <div 
            v-for="g in 8" 
            :key="'c-' + col + '-g-' + g"
            :class="['g' + col, 'gris', { 'circulo-visible': col <= serieSeleccionada }]"
            :id="'grado' + g + '-' + col"
          ></div>
        </template>

        <!-- Grados con signo de interrogación (gradop) correspondientes a cada columna -->
        <img 
          v-for="col in 10"
          :key="'gradop-' + col"
          class="gp" 
          :id="'gradop' + col" 
          src="/images/gradop.png" 
          draggable="true"
          :style="{
            left: (gradopPosiciones[col - 1]?.left || (490 + (col - 1) * 39)) + 'px',
            top: (gradopPosiciones[col - 1]?.top || 145) + 'px',
            display: gradopPosiciones[col - 1]?.visible ? 'inline' : 'none'
          }"
        >

        <!-- Capa de Portada y Registro -->
        <template v-if="fase !== 'juego'">
          <img id="fondoEntrada" src="/images/portadaFondo.png">

          <template v-if="fase === 'portada'">
            <img class="portada" id="portada1" src="/images/portada1.png">
            <img class="portada" id="portada2" src="/images/portada2.png">
            <img class="portada" id="portada3" src="/images/portada3.png">

            <img class="portada" id="creditos1" src="/images/creditos1.png">
            <img class="portada" id="creditos2" src="/images/creditos2.png">
            <img class="portada" id="creditos3" src="/images/creditos3.png">
            <img class="portada" id="creditos4" src="/images/creditos4.png">
            <img class="portada" id="creditos5" src="/images/creditos5.png">
            <img class="portada" id="creditos6" src="/images/creditos6.png">

            <div id="boton1" @click="iniciarRegistro">REGISTRARSE</div>
          </template>

          <template v-else-if="fase === 'registro'">
            <input 
              class="regis" 
              :class="{ error: errorNombre }"
              type="text" 
              id="nombre" 
              placeholder="Escriba su nombre" 
              v-model="nombreUsuario"
              @keyup.enter="entrarAlJuego"
            >
            <input 
              class="regis" 
              :class="{ error: errorCodigo }"
              type="number" 
              id="codigo" 
              placeholder="Escriba su código" 
              v-model="codigoUsuario"
              @keyup.enter="entrarAlJuego"
            >
            <div id="entrar" @click="entrarAlJuego">ENTRAR</div>
          </template>
        </template>
        
    </div>
</template>

<style scoped>
/* Las imágenes de portada estaban en opacity: 0 en el CSS antiguo */
.portada {
  opacity: 1 !important;
  animation: fadeIn 0.4s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

#boton1 {
  cursor: pointer;
  user-select: none;
  background-color: rgba(255, 255, 255, 0.9);
  color: rgb(40, 40, 40) !important;
  border: 2px solid rgb(100, 100, 100) !important;
  font-weight: bold;
  text-align: center;
  line-height: 23px;
  transition: all 0.2s ease;
}

#boton1:hover {
  background-color: #ffffff;
  color: rgb(0, 100, 255) !important;
  border-color: rgb(210, 100, 20) !important;
}

#entrar {
  cursor: pointer;
  user-select: none;
  background-color: rgba(255, 255, 255, 0.9);
  color: rgb(40, 40, 40) !important;
  border: 2px solid rgb(100, 100, 100) !important;
  font-weight: bold;
  text-align: center;
  line-height: 23px;
  transition: all 0.2s ease;
}

#entrar:hover {
  background-color: #ffffff;
  color: rgb(0, 100, 255) !important;
  border-color: rgb(210, 100, 20) !important;
}

.regis {
  border: 2px solid rgb(100, 100, 100);
  box-sizing: border-box;
  padding: 0 8px;
}

.regis.error {
  border: 2px solid #ff4444 !important;
  background-color: #ffe6e6 !important;
}

/* Reactividad de los selectores */
.numserie, .meta, .modo, .tonal {
  user-select: none;
  font-weight: normal !important; /* Evitar que se desborden */
  transition: all 0.15s ease;
  text-align: center;
  cursor: pointer;
}

.panel-fade-in {
  animation: fadeIn 0.3s ease-in forwards;
}

/* Bloqueo del panel de tonalidad mientras suena la tonalidad */
.tonal.bloqueado {
  pointer-events: none !important;
  cursor: default !important;
  opacity: 0.65;
}

/* Alineación exacta de los números de serie con los círculos (ancho 29px centrado) */
.numserie {
  width: 29px !important;
  padding-left: 0px !important;
  text-align: center !important;
  line-height: 24px;
}

#uno { left: 489px !important; }
#dos { left: 528px !important; }
#tres { left: 567px !important; }
#cuatro { left: 606px !important; }
#cinco { left: 645px !important; }
#seis { left: 684px !important; }
#siete { left: 723px !important; }
#ocho { left: 762px !important; }
#nueve { left: 801px !important; }
#diez { left: 840px !important; }

/* Instrucciones en color azul claro */
#encabezado {
  color: rgb(100, 210, 255) !important;
  text-shadow: 0 0 4px rgba(0, 180, 255, 0.4);
  font-family: inherit;
  white-space: pre;
}

/* Serie */
.numserie.seleccionado {
  color: rgb(210, 100, 20) !important;
}
.marca {
  opacity: 0.1;
  transition: opacity 0.2s ease;
}
.marca.visible {
  opacity: 0.9 !important;
}

/* Círculos punteados correspondientes a las columnas de la serie */
.circulo-visible {
  border: 1px dashed gray !important;
}

/* Resaltado de secciones activas (permanecen encendidas una vez activadas) */
#tituloSerie, #meta, #tituloModos, #titulo {
  color: rgb(60, 60, 60);
  transition: color 0.2s ease;
}

#marcoMeta, #marcoModos, #marcoTonalidades {
  border: 1px solid rgb(60, 60, 60);
  transition: border-color 0.2s ease;
}

#tituloSerie.activo, #meta.activo, #tituloModos.activo, #titulo.activo {
  color: rgb(210, 100, 20) !important;
}
#marcoMeta.activo, #marcoModos.activo, #marcoTonalidades.activo {
  border: 1px solid rgb(0, 124, 250) !important;
}

/* Elementos seleccionados (sin font-weight bold para no alterar dimensiones) */
.meta.seleccionado, .modo.seleccionado, .tonal.seleccionado {
  border: 2px solid rgb(210, 100, 20) !important;
  color: rgb(0, 100, 255) !important;
}

.meta:hover:not(.bloqueado), .modo:hover:not(.bloqueado), .tonal:hover:not(.bloqueado), .numserie:hover:not(.bloqueado) {
  color: rgb(0, 100, 255) !important;
}

/* Bloqueo de paneles durante el juego */
.numserie.bloqueado, .meta.bloqueado, .modo.bloqueado {
  pointer-events: none !important;
  cursor: default !important;
  opacity: 0.65;
}

.panel-bloqueado {
  opacity: 0.65;
}

/* Botones de acción */
#nuevosonido, #repetirsonido, #oirtonalidad, #reiniciar {
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 13px;
  line-height: 1.2;
  border: 1px solid currentColor;
  transition: all 0.2s ease;
  cursor: pointer;
}

#reiniciar {
  position: absolute;
  left: 740px;
  top: 520px;
  width: 72px;
  height: 43px;
  color: rgb(255, 120, 60);
  border-radius: 5px;
}

#nuevosonido:hover:not(.bloqueado) {
  background-color: rgba(0, 220, 255, 0.2);
}

#repetirsonido:hover:not(.bloqueado) {
  background-color: rgba(255, 208, 0, 0.2);
}

#oirtonalidad:hover:not(.bloqueado) {
  background-color: rgba(0, 130, 255, 0.2);
}

#reiniciar:hover:not(.bloqueado) {
  background-color: rgba(255, 120, 60, 0.2);
}

#nuevosonido.bloqueado, 
#repetirsonido.bloqueado, 
#oirtonalidad.bloqueado,
#reiniciar.bloqueado {
  pointer-events: none !important;
  opacity: 0.4 !important;
  cursor: default !important;
}

/* Marcadores */
#marcador1 {
  color: rgb(60, 60, 60);
  font-weight: normal;
  user-select: none;
  transition: color 0.3s ease;
}

#marcador2 {
  color: rgb(60, 60, 60);
  font-weight: normal;
  user-select: none;
  transition: color 0.3s ease;
}

#marcador1.activo-aciertos {
  color: rgb(0, 220, 0) !important;
}

#marcador2.activo-fallos {
  color: rgb(180, 180, 180) !important;
}

#teclado {
  transition: top 0.25s ease-out;
}

.grado {
  cursor: pointer;
  left: 340px;
  opacity: 0.4;
  transition: left 0.35s ease, opacity 0.2s ease, filter 0.2s ease;
}

.grado.grados-visibles {
  left: 410px !important;
  opacity: 0.8 !important;
}

.grado.grado-activo {
  left: 410px !important;
  opacity: 1 !important;
  filter: drop-shadow(0 0 6px rgb(0, 180, 255)) brightness(1.2);
}

.grado.bloqueado {
  pointer-events: none !important;
}

.grado:hover {
  opacity: 1 !important;
  filter: drop-shadow(0 0 6px rgb(0, 180, 255)) brightness(1.2);
}
</style>
