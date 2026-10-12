<script setup>
import { ref, computed } from 'vue'

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

  // Reproducir el sonido al arrancar el tecleo
  reproducirSonidoTeclado()

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

// Banderas de paneles que ya han sido activados (una vez activados, se quedan iluminados)
const serieActivada = ref(true)
const metaActivada = ref(false)
const modoActivado = ref(false)
const tonalidadActivada = ref(false)

// 1. Tamaño de serie (1..10)
const serieSeleccionada = ref(1)
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

// Funciones de selección por paso
const seleccionarSerie = (num) => {
  serieSeleccionada.value = num
  metaActivada.value = true

  // Si aún no se ha configurado la tonalidad, avanzamos en la guía inicial
  if (pasoConfig.value !== 'listo') {
    pasoConfig.value = 'meta'
    cambiarInstruccion('Selecciona un número en Meta')
  }
}

const seleccionarMeta = (num) => {
  metaSeleccionada.value = num
  modoActivado.value = true

  if (pasoConfig.value !== 'listo') {
    pasoConfig.value = 'modo'
    cambiarInstruccion('Selecciona una Clase de escala')
  }
}

const seleccionarModo = (modo) => {
  modoSeleccionado.value = modo.id
  tonalidadActivada.value = true

  if (pasoConfig.value !== 'listo') {
    pasoConfig.value = 'tonalidad'
    cambiarInstruccion('Selecciona una tonalidad')
  }
}

const seleccionarTonalidad = (tonalidad) => {
  tonalidadSeleccionada.value = tonalidad.id
  pasoConfig.value = 'listo'
  cambiarInstruccion('Haz clic en Nuevo sonido para iniciar')
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
  cambiarInstruccion('Selecciona el tamaño de la serie')
}
</script>

<template>
  <div id="pantprinc"> 
        <img id="baseGrados" src="/images/baseGrados.png">
        <img class="grado" id="grado1" src="/images/grado1.png">
        <img class="grado" id="grado2" src="/images/grado2.png">
        <img class="grado" id="grado3" src="/images/grado3.png">
        <img class="grado" id="grado4" src="/images/grado4.png">
        <img class="grado" id="grado5" src="/images/grado5.png">
        <img class="grado" id="grado6" src="/images/grado6.png">
        <img class="grado" id="grado7" src="/images/grado7.png">
        <img class="grado" id="grado8" src="/images/grado8.png">

        <img id="fondoTeclado" src="/images/fondoTeclado.png">
        <img id="teclado" src="/images/teclado.png">
        <img id="maskTeclado" src="/images/maskTeclado.png">
        
        <img id="fondosupA" src="/images/fondosupA.png">
        <img id="fondosupB" src="/images/fondosupB.png">
        <img id="fondoinfA" src="/images/fondoinfA.png">
        <img id="fondoinfB" src="/images/fondoinfB.png">

        <div id="reloj">{{ reloj }}</div>

        <div id="titulo" :class="{ activo: tonalidadActivada }">Tonalidad</div>
        <div id="marcoTonalidades" :class="{ activo: tonalidadActivada }"></div>

        <div id="encabezado">{{ encabezadoTexto }}</div>
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
        <div 
          v-for="ton in tonalidades" 
          :key="ton.id" 
          class="tonal" 
          :id="ton.id"
          :class="{ 
            seleccionado: tonalidadSeleccionada === ton.id,
            disponible: tonalidadActivada
          }"
          @click="seleccionarTonalidad(ton)"
        >{{ modoSeleccionado === 0 || modoSeleccionado === null ? ton.nombreMayor : ton.nombreMenor }}</div>

        <!-- Meta -->
        <div id="meta" :class="{ activo: metaActivada }">Meta</div>
        <div id="marcoMeta" :class="{ activo: metaActivada }"></div>
        <div 
          v-for="(m, idx) in metas" 
          :key="m" 
          class="meta" 
          :id="'meta' + (idx + 1)"
          :class="{ 
            seleccionado: metaSeleccionada === m,
            disponible: metaActivada
          }"
          @click="seleccionarMeta(m)"
        >{{ m }}</div>
        
        <!-- Clase de escala / Modos -->
        <div id="tituloModos" :class="{ activo: modoActivado }">Clase de escala</div>
        <div id="marcoModos" :class="{ activo: modoActivado }"></div>

        <div 
          v-for="m in modos" 
          :key="m.id" 
          class="modo" 
          :id="'modo' + (m.id + 1)"
          :class="{ 
            seleccionado: modoSeleccionado === m.id,
            disponible: modoActivado
          }"
          @click="seleccionarModo(m)"
        >{{ m.nombre }}</div>

        <div id="nuevosonido" :class="{ activo: pasoConfig === 'listo' }"></div>
        <div id="repetirsonido" :class="{ activo: pasoConfig === 'listo' }"></div>
       
        <div id="oirtonalidad" :class="{ activo: tonalidadSeleccionada !== null }">Oir tonalidad</div>
        <div id="marcador1">{{ aciertos }}</div>
        <div id="marcador2">{{ fallos }}</div>

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
        <div id="tituloSerie" :class="{ activo: serieActivada }">Tamaño de la serie:</div>
        <div 
          v-for="(num, idx) in series" 
          :key="num" 
          class="numserie" 
          :id="idsSerie[idx]"
          :class="{ 
            seleccionado: num <= serieSeleccionada,
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
        <img id="sombraGradop" src="/images/sombraGradop.png">

        <!-- Grados / Círculos punteados por columna (g1..g10) -->
        <template v-for="col in 10" :key="'col-' + col">
          <div 
            v-for="g in 8" 
            :key="'c-' + col + '-g-' + g"
            :class="['g' + col, 'gris', { 'circulo-visible': col <= serieSeleccionada }]"
            :id="'grado' + g + '-' + col"
          ></div>
        </template>

        <img class="gp" id="gradop1" src="/images/gradop.png" draggable="true">
        <img class="gp" id="gradop2" src="/images/gradop.png" draggable="true">
        <img class="gp" id="gradop3" src="/images/gradop.png" draggable="true">
        <img class="gp" id="gradop4" src="/images/gradop.png" draggable="true">
        <img class="gp" id="gradop5" src="/images/gradop.png" draggable="true">
        <img class="gp" id="gradop6" src="/images/gradop.png" draggable="true">
        <img class="gp" id="gradop7" src="/images/gradop.png" draggable="true">
        <img class="gp" id="gradop8" src="/images/gradop.png" draggable="true">
        <img class="gp" id="gradop9" src="/images/gradop.png" draggable="true">
        <img class="gp" id="gradop10" src="/images/gradop.png" draggable="true">

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
  cursor: pointer;
  user-select: none;
  font-weight: normal !important; /* Evitar que se desborden */
  transition: all 0.15s ease;
  text-align: center;
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

.meta:hover, .modo:hover, .tonal:hover, .numserie:hover {
  color: rgb(0, 100, 255) !important;
}

/* Botones de acción */
#nuevosonido.activo, #repetirsonido.activo, #oirtonalidad.activo {
  cursor: pointer;
  opacity: 1 !important;
}
</style>
