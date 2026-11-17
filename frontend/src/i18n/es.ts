/** Las palabras de TaxSort en español. Ver en.ts para las reglas. */

import type { Translation } from "./en.ts";

const es: Translation = {
  // ─── ui ───
  "ui.app.welcome": "Tus transacciones, ordenadas por línea del IRS, guardadas bajo tu clave.",
  "ui.app.loading": "Cargando…",
  "ui.app.signedOutNote": "Sin correo. Sin contraseña. Sin KYC.",
  "ui.app.privacyLink": "Política de privacidad",
  "ui.app.statusFailed": "Falló la conexión MCP",
  "ui.app.retry": "Reintentar",
  "ui.app.connecting": "Conectando con TaxSort MCP…",
  "ui.app.connected": "Conectado a <service/> v{{version}}",
  "ui.app.fingerprintTitle": "Huella del npub del operador: comprueba que coincide con los DM de TaxSort",
  "ui.app.vaultNotConfigured": "(bóveda aún sin configurar)",

  "ui.nav.sessions": "Sesiones",
  "ui.nav.sessionsTitle": "Crea sesiones por año fiscal y cambia entre ellas",
  "ui.nav.import": "Importar",
  "ui.nav.importTitle": "Subir archivos CSV del banco",
  "ui.nav.accounts": "Cuentas",
  "ui.nav.accountsTitle": "Marca el tipo de cada cuenta, mira alias y transacciones",
  "ui.nav.transactions": "Transacciones",
  "ui.nav.transactionsTitle": "Explora y busca las transacciones importadas",
  "ui.nav.categorize": "→ Categorizar →",
  "ui.nav.categorizeTitle": "Categorizar con IA las transacciones importadas",
  "ui.nav.categorized": "Categorizadas",
  "ui.nav.categorizedTitle": "Ver los totales por categoría",
  "ui.nav.subscriptions": "Suscripciones",
  "ui.nav.subscriptionsTitle": "Encontrar cargos recurrentes y fugas de dinero",
  "ui.nav.advisor": "Asesor",
  "ui.nav.advisorTitle": "Pregúntale al asesor financiero sobre TaxSort",
  "ui.nav.taxCode": "Código fiscal",
  "ui.nav.taxCodeTitle": "Buscar secciones del código del IRS, capítulo y versículo",
  "ui.nav.feedback": "Comentarios",
  "ui.nav.feedbackTitle": "Reportar errores, pedir funciones, hacer preguntas",
  "ui.nav.usage": "Uso y costos",
  "ui.nav.usageTitle": "Uso de la IA y costos estimados",
  "ui.nav.wallet": "Billetera",
  "ui.nav.walletTitle": "Saldo de crédito y recargas Lightning",
  "ui.nav.settings": "Ajustes",
  "ui.nav.settingsTitle": "Tiempo de bloqueo, compartir y acerca de",
  "ui.nav.privacy": "Privacidad",
  "ui.nav.privacyTitle": "Cómo se protegen tus datos",
  "ui.nav.logOut": "Cerrar sesión",
  "ui.nav.profile": "Perfil",
  "ui.nav.session": "Sesión:",
  "ui.nav.collaborators_one": "{{count}} colaborador",
  "ui.nav.collaborators_many": "{{count}} colaboradores",
  "ui.nav.collaborators_other": "{{count}} colaboradores",

  "ui.lock.title": "Sesión caducada",
  "ui.lock.pasteNsec": "Pega el nsec con el que entraste para seguir.",
  "ui.lock.enterPassphrase": "Escribe tu frase de paso para seguir. Es la frase que enviaste como respuesta cuando entraste por DM de Nostr.",
  "ui.lock.passphrasePlaceholder": "Tu frase de paso…",
  "ui.lock.wrongKey": "Esa no es la clave con la que entró este navegador.",
  "ui.lock.wrongPassphrase": "Frase de paso incorrecta.",
  "ui.lock.verifying": "Comprobando…",
  "ui.lock.unlock": "Desbloquear",
  "ui.lock.signOut": "Cerrar sesión (volverás a entrar)",

  // ─── views ───
  "views.common.refresh": "Actualizar",
  "views.common.cancel": "Cancelar",
  "views.common.loading": "Cargando…",
  "views.common.saving": "Guardando…",
  "views.common.save": "Guardar",
  "views.common.done": "Listo",
  "views.common.search": "Buscar",
  "views.common.clear": "Borrar",
  "views.common.applying": "Aplicando…",
  "views.common.clearing": "Borrando…",
  "views.common.manual": "manual",
  "views.common.rule": "regla",
  "views.common.transactions_one": "{{count}} transacción",
  "views.common.transactions_many": "{{count}} transacciones",
  "views.common.transactions_other": "{{count}} transacciones",

  "views.table.date": "Fecha",
  "views.table.description": "Descripción",
  "views.table.amount": "Importe",
  "views.table.account": "Cuenta",
  "views.table.category": "Categoría",
  "views.table.all": "Todas",
  "views.table.group": "Agrupar",
  "views.table.groupOrder": "Orden de los grupos",
  "views.table.sortBy": "Ordenar por",
  "views.table.sortDirection": "Sentido del orden",
  "views.table.groupNone": "Sin agrupar",
  "views.table.groupCategory": "Categoría",
  "views.table.groupSubcategory": "Subcategoría",
  "views.table.groupTaxLine": "Línea fiscal (IRS)",
  "views.table.groupMonth": "Mes",
  "views.table.groupAccount": "Cuenta",
  "views.table.groupMerchant": "Comercio",
  "views.table.groupMonthCategory": "Mes + categoría",
  "views.table.groupCategorySub": "Categoría + subcategoría",
  "views.table.searchPlaceholder": "Buscar en las descripciones (regex)…",
  "views.table.expandAll": "Desplegar todo",
  "views.table.collapseAll": "Plegar todo",
  "views.table.indistinguishable": "Duplicado imposible de distinguir",
  "views.table.firstPage": "Primera página",
  "views.table.lastPage": "Última página",
  "views.table.prev": "← Anterior",
  "views.table.next": "Siguiente →",
  "views.table.page": "Página {{page}} de {{pages}} ({{total}} en total)",

  "views.sessions.title": "Sesiones fiscales",
  "views.sessions.closeSession": "Cerrar la sesión",
  "views.sessions.new": "Nueva sesión",
  "views.sessions.newPlaceholder": "p. ej. Impuestos 2025",
  "views.sessions.creating": "Creando…",
  "views.sessions.create": "Crear →",
  "views.sessions.yours": "Tus sesiones",
  "views.sessions.row_one": "{{count}} transacción · actualizada el {{date}}",
  "views.sessions.row_many": "{{count}} transacciones · actualizada el {{date}}",
  "views.sessions.row_other": "{{count}} transacciones · actualizada el {{date}}",
  "views.sessions.none": "Aún no hay sesiones. Crea una arriba para empezar.",
  "views.sessions.share": "Comparte una sesión usando el mismo npub en varios dispositivos.",

  "views.import.title": "Importar transacciones",
  "views.import.clearAll": "Borrar todas las transacciones…",
  "views.import.confirmClear": "¿Eliminar todas las transacciones y clasificaciones?",
  "views.import.yesClear": "Sí, borrar",
  "views.import.cleared": "Se borraron {{transactions}} transacciones y {{classifications}} clasificaciones.",
  "views.import.sources": "Fuentes importadas",
  "views.import.confirmRemove": "¿Quitar las {{count}} transacciones de «{{account}}»?\nTambién se eliminarán sus clasificaciones.",
  "views.import.removeTitle": "Quitar todas las transacciones de {{account}}",
  "views.import.drop": "Suelta archivos CSV o haz clic para buscarlos",
  "views.import.assign": "Asigna cada archivo a una cuenta. Los archivos con el mismo nombre de cuenta se tratan como una misma fuente.",
  "views.import.size": "{{size}} KB",
  "views.import.account": "Cuenta:",
  "views.import.accountPlaceholder": "p. ej. Chase 8890",
  "views.import.grouped": "agrupado",
  "views.import.groupedTitle": "Varios archivos comparten este nombre de cuenta",
  "views.import.reading": "Leyendo {{file}}…",
  "views.import.importing": "Importando {{file}}…",
  "views.import.importingButton": "Importando…",
  "views.import.importFiles": "Importar archivos",
  "views.import.results": "Resultados de la importación",
  "views.import.added": "{{count}} nuevas",
  "views.import.deduped": "· {{count}} duplicados quitados",
  "views.import.ambiguous": "· {{count}} ambiguas",
  "views.import.totalInSession_one": "{{count}} transacción en la sesión",
  "views.import.totalInSession_many": "{{count}} transacciones en la sesión",
  "views.import.totalInSession_other": "{{count}} transacciones en la sesión",
  "views.import.reviewAccounts": "Revisar las cuentas →",
  "views.import.classify": "Clasificar con Claude →",
  "views.import.viewTransactions": "Ver las transacciones",

  "views.accounts.title": "Cuentas",
  "views.accounts.intro": "Marca el tipo de cada cuenta para que el clasificador encuentre duplicados de exportaciones CSV que se solapan y detecte transferencias entre tus propias cuentas. Elige los tipos <b>antes</b> de clasificar para obtener mejores resultados.",
  "views.accounts.loading": "Cargando cuentas…",
  "views.accounts.empty": "Aún no hay transacciones importadas. Importa primero los CSV.",
  "views.accounts.aliases": "Alias de cuentas detectados (mismos últimos 4 dígitos)",
  "views.accounts.aliasesNote": "El clasificador trata las transacciones de cuentas con alias como posibles duplicados.",
  "views.accounts.sources": "Fuentes:",
  "views.accounts.loadingTransactions": "Cargando transacciones…",
  "views.accounts.noTransactions": "No se encontraron transacciones.",
  "views.accounts.type.bank": "Banco",
  "views.accounts.type.bankHint": "Cuenta corriente o de ahorro",
  "views.accounts.type.card": "Tarjeta",
  "views.accounts.type.cardHint": "Tarjeta de crédito o débito",
  "views.accounts.type.investment": "Inversión",
  "views.accounts.type.investmentHint": "Corretaje o cripto",
  "views.accounts.type.loan": "Préstamo",
  "views.accounts.type.loanHint": "Hipoteca, auto, estudios",
  "views.accounts.type.unknown": "Desconocido",
  "views.accounts.type.unknownHint": "Aún sin categorizar",

  "views.transactions.title": "Transacciones",
  "views.transactions.about": "Transacciones muestra las líneas de tus CSV tal como se importaron, antes de categorizar: el diario contable sin procesar.",
  "views.transactions.loadFailed": "No se pudieron cargar las transacciones",
  "views.transactions.show": "Mostrar",
  "views.transactions.scopeAll": "Todas las transacciones",
  "views.transactions.scopeTax": "Partidas fiscales (Sch A + C)",
  "views.transactions.scopeC": "Solo Schedule C",
  "views.transactions.scopeA": "Solo Schedule A",
  "views.transactions.amountPlaceholder": "p. ej. <-95, [0..10), !33",
  "views.transactions.amountTitle": "Filtro de importe: <, <=, >, >=, =, !=, !N, not N, gt/gte/lt/lte/eq/neq N, [lo..hi), (lo..hi], lo..hi",
  "views.transactions.clearFilters": "Quitar filtros",
  "views.transactions.subFilter": "Filtrado por subcategoría: <b>{{sub}}</b>",
  "views.transactions.noMatch": "Ninguna transacción coincide con este filtro.",
  "views.transactions.ambiguousInCsv": "Duplicado imposible de distinguir en el CSV",
  "views.transactions.classification": "Clasificación",
  "views.transactions.removeTitle": "Quitar la clasificación",
  "views.transactions.confirmRevert": "¿Quitar la clasificación? La transacción vuelve a quedar sin categoría.",
  "views.transactions.findSimilar": "Buscar transacciones parecidas",
  "views.transactions.ruleHeading": "¿Crear una regla?",
  "views.transactions.ruleApply": "Aplicar <b>{{category}} / {{sub}}</b> a las transacciones que coincidan con esta regex:",
  "views.transactions.saveRule": "Guardar la regla",
  "views.transactions.skip": "Omitir",
  "views.transactions.ruleSaved": "Regla guardada: <code>/{{pattern}}/</code> → {{category}} / {{sub}}",
  "views.transactions.applyAll": "Aplicar a todas las que coincidan",
  "views.transactions.ruleApplied_one": "Regla aplicada: {{count}} transacción actualizada",
  "views.transactions.ruleApplied_many": "Regla aplicada: {{count}} transacciones actualizadas",
  "views.transactions.ruleApplied_other": "Regla aplicada: {{count}} transacciones actualizadas",

  "views.classify.title": "Categorizar",
  "views.classify.total": "Total",
  "views.classify.categorized": "Categorizadas",
  "views.classify.uncategorized": "Sin categoría",
  "views.classify.running": "Categorizando…",
  "views.classify.paused": "En pausa",
  "views.classify.complete": "Terminado",
  "views.classify.importFirst": "Importa primero las transacciones",
  "views.classify.ready": "Listo para categorizar",
  "views.classify.error": "Algo salió mal",
  "views.classify.usage": "Uso de la IA:",
  "views.classify.calls": "{{count}} llamadas",
  "views.classify.tokensIn": "{{count}} de entrada",
  "views.classify.tokensOut": "{{count}} de salida",
  "views.classify.tokensTotal": "{{count}} tokens en total",
  "views.classify.runHeading": "Categorizar con Claude AI",
  "views.classify.runIntro": "Categoriza con Claude las transacciones sin categoría, directamente desde tu navegador. Primero se aplican las reglas y luego la IA categoriza el resto.",
  "views.classify.categorizeN": "Categorizar {{count}} sin categoría",
  "views.classify.allDone": "Todo clasificado",
  "views.classify.confirmRecategorize": "¿Volver a categorizar las {{count}} transacciones?\n\nClaude AI vuelve a pasar por cada transacción, incluidas las ya categorizadas y las editadas a mano. Úsalo cuando las reglas hayan mejorado.",
  "views.classify.recategorizeAll": "Recategorizar todo ({{count}})",
  "views.classify.confirmReset": "¿Eliminar todas las categorizaciones? Las transacciones se conservan.",
  "views.classify.resetDone": "Se borraron {{count}} clasificaciones.",
  "views.classify.resetAll": "Restablecer todas las categorías",
  "views.classify.importFirstDot": "Importa primero las transacciones.",
  "views.classify.pause": "Pausar la categorización",
  "views.classify.resume": "Reanudar la categorización",
  "views.classify.pausedAt": "En pausa al {{pct}} %",
  "views.classify.refreshStats": "Actualizar las cifras",
  "views.classify.rulesHeading": "Reglas de categorización",
  "views.classify.applyNow": "Aplicar reglas ahora",
  "views.classify.newRule": "+ Nueva regla",
  "views.classify.rulesIntro": "Las reglas dan una categoría a las transacciones importadas al reconocer patrones en la descripción. No cambian los datos importados: las categorías se guardan aparte. «Aplicar reglas ahora» vuelve a pasar cada regla por cada transacción. Haz clic en una regla para editarla.",
  "views.classify.applied_one": "Reglas aplicadas: {{count}} transacción actualizada.",
  "views.classify.applied_many": "Reglas aplicadas: {{count}} transacciones actualizadas.",
  "views.classify.applied_other": "Reglas aplicadas: {{count}} transacciones actualizadas.",
  "views.classify.searchRules": "Buscar reglas (patrón, categoría, subcategoría)…",
  "views.classify.patternLabel": "Patrón de descripción (regex, sin distinguir mayúsculas)",
  "views.classify.matches_one": "{{count}} coincidencia",
  "views.classify.matches_many": "{{count}} coincidencias",
  "views.classify.matches_other": "{{count}} coincidencias",
  "views.classify.checking": "comprobando…",
  "views.classify.patternPlaceholder": "p. ej. mr cooper|nationstar|rocket mortgage",
  "views.classify.category": "Categoría",
  "views.classify.subcategory": "Subcategoría ({{count}})",
  "views.classify.subcategoryCustom": "Subcategoría ({{count}} + {{custom}} propias)",
  "views.classify.select": "Elegir…",
  "views.classify.amountFilter": "Filtro de importe",
  "views.classify.any": "Cualquiera",
  "views.classify.amountValue": "Valor del importe",
  "views.classify.renameTo": "Renombrar como (opcional)",
  "views.classify.renamePlaceholder": "Nueva descripción",
  "views.classify.updateRule": "Actualizar la regla",
  "views.classify.saveRule": "Guardar la regla",
  "views.classify.noRules": "Aún no hay reglas.",
  "views.classify.ruleAmount": "importe {{op}} {{value}}",
  "views.classify.ruleRename": "renombrar: «{{name}}»",
  "views.classify.customHeading": "Categorías propias",
  "views.classify.newCategory": "+ Nueva categoría",
  "views.classify.customIntro": "Añade las subcategorías que le faltan a la lista integrada. El categorizador de IA también las aprende.",
  "views.classify.customCategoryPlaceholder": "p. ej. Personal",
  "views.classify.subcategoryLabel": "Subcategoría",
  "views.classify.customSubPlaceholder": "p. ej. Gasolina",
  "views.classify.addCategory": "Añadir la categoría",
  "views.classify.noCustom": "No hay categorías propias. Las integradas cubren la mayoría de los casos.",
  "views.classify.errors": "Errores de categorización",
  "views.classify.recent": "Categorizadas hace poco",

  "views.donut.classified": "Clasificadas",
  "views.donut.needsReview": "Por revisar",
  "views.donut.other": "Otras",

  "views.reason.duplicateOf": "duplicado de",
  "views.reason.twin": "gemela",
  "views.reason.goTo": "Ir a la transacción {{id}}",

  "views.summary.title": "Categorizadas",
  "views.summary.about": "Categorizadas muestra tu actividad categorizada por la IA: el diario contable después de que las reglas y la IA asignaron las categorías fiscales.",
  "views.summary.count": "{{count}} categorizadas",
  "views.summary.noMatch": "Ninguna transacción categorizada coincide con este filtro.",

  "views.subscriptions.title": "Suscripciones",
  "views.subscriptions.lede": "Encuentra cargos recurrentes y fugas de dinero olvidadas",
  "views.subscriptions.scanning": "Analizando…",
  "views.subscriptions.rescan": "Volver a analizar",
  "views.subscriptions.scan": "Buscar suscripciones",
  "views.subscriptions.phase.fetching": "Cargando transacciones…",
  "views.subscriptions.phase.analyzing": "Buscando patrones recurrentes…",
  "views.subscriptions.phase.enriching": "Buscando enlaces para cancelar…",
  "views.subscriptions.working": "Trabajando…",
  "views.subscriptions.recurring": "Suscripciones recurrentes",
  "views.subscriptions.spent": "Total gastado (en los datos)",
  "views.subscriptions.projected": "Costo anual previsto",
  "views.subscriptions.none": "No se encontraron suscripciones recurrentes. ¡Bien!",
  "views.subscriptions.freq.daily": "diaria",
  "views.subscriptions.freq.weekly": "semanal",
  "views.subscriptions.freq.monthly": "mensual",
  "views.subscriptions.freq.quarterly": "trimestral",
  "views.subscriptions.freq.annual": "anual",
  "views.subscriptions.per.daily": "/día",
  "views.subscriptions.per.weekly": "/semana",
  "views.subscriptions.per.monthly": "/mes",
  "views.subscriptions.per.quarterly": "/trimestre",
  "views.subscriptions.per.annual": "/año",
  "views.subscriptions.perYear": "{{amount}}/año",
  "views.subscriptions.charges_one": "{{count}} cargo",
  "views.subscriptions.charges_many": "{{count}} cargos",
  "views.subscriptions.charges_other": "{{count}} cargos",
  "views.subscriptions.firstSeen": "Visto por primera vez:",
  "views.subscriptions.lastSeen": "Visto por última vez:",
  "views.subscriptions.totalSpent": "Total gastado:",
  "views.subscriptions.cancel": "Cancelar / darse de baja →",
  "views.subscriptions.cancelVia": "Cancelar por {{method}}",
  "views.subscriptions.noCancelInfo": "No hay información para cancelar",
  "views.subscriptions.emptyIntro": "Analiza tus transacciones importadas para encontrar suscripciones recurrentes.",
  "views.subscriptions.emptyNote": "Encuentra patrones diarios, semanales, mensuales, trimestrales y anuales, y busca enlaces para cancelar cuando puede.",

  "views.advisor.title": "Asesor financiero",
  "views.advisor.lede": "Pregúntame lo que quieras sobre cómo usar TaxSort",
  "views.advisor.whatToAsk": "¿Qué puedo preguntar?",
  "views.advisor.thinking": "Pensando…",
  "views.advisor.placeholder": "Pregúntale al asesor financiero…",
  "views.advisor.ask": "Preguntar",
  "views.advisor.error": "Error: {{error}}",
  "views.advisor.you": "Yo",
  "views.advisor.prompt.1": "¿Qué puede hacer TaxSort por mí?",
  "views.advisor.prompt.2": "¿Cómo importo mis transacciones bancarias?",
  "views.advisor.prompt.3": "¿Qué diferencia hay entre el Schedule A y el Schedule C?",
  "views.advisor.prompt.4": "¿Cómo funciona la clasificación?",
  "views.advisor.prompt.5": "¿Qué hago después de importar los CSV?",
  "views.advisor.prompt.6": "¿Cómo comparto mi sesión con mi pareja?",
  "views.advisor.prompt.7": "¿Qué significa «ambigua» en una transacción importada?",
  "views.advisor.prompt.8": "¿Cómo corrijo una clasificación con la que no estoy de acuerdo?",
  "views.advisor.fact.1": "El IRS procesa más de 150 millones de declaraciones individuales cada año.",
  "views.advisor.fact.2": "El código fiscal de EE. UU. tiene más de 10 000 páginas. Los reglamentos añaden más de 80 000.",
  "views.advisor.fact.3": "La deducción por oficina en casa puede ahorrar a los autónomos más de 1500 $ al año.",
  "views.advisor.fact.4": "Los estadounidenses dedican 6500 millones de horas al año a cumplir con los impuestos.",
  "views.advisor.fact.5": "El dueño medio de un pequeño negocio dedica 240 horas al año a los impuestos.",
  "views.advisor.fact.6": "La Section 179 permite deducir el costo total de un equipo que califique el año en que lo compras.",
  "views.advisor.fact.7": "La deducción estándar de 2025 es de 15 000 $ para quien declara solo y de 30 000 $ para matrimonios que declaran juntos.",
  "views.advisor.fact.8": "Las comidas de negocios son deducibles al 50 % según el IRC §274(n). En 2021-2022 lo fueron al 100 % por un tiempo.",
  "views.advisor.fact.9": "El tope de 10 000 $ de la deducción SALT llegó con la Tax Cuts and Jobs Act de 2017.",
  "views.advisor.fact.10": "El impuesto de los autónomos es del 15,3 %: 12,4 % para la Social Security y 2,9 % para Medicare.",
  "views.advisor.fact.11": "El IRS calcula una brecha fiscal de 688 000 millones de dólares al año: impuestos debidos pero no pagados.",
  "views.advisor.fact.12": "Las donaciones benéficas pueden compensar hasta el 60 % de tu ingreso bruto ajustado.",
  "views.advisor.fact.13": "El primer impuesto sobre la renta de EE. UU. se cobró en 1861 para financiar la Guerra de Secesión.",
  "views.advisor.fact.14": "Se dice que Albert Einstein afirmó: «Lo más difícil de entender en el mundo es el impuesto sobre la renta».",
  "views.advisor.fact.15": "Solo alrededor del 10 % de los contribuyentes detalla sus deducciones. El resto toma la deducción estándar.",
  "views.advisor.fact.16": "Los pagos trimestrales estimados vencen el 15 de abril, el 15 de junio, el 15 de septiembre y el 15 de enero.",

  "views.researcher.title": "Investigador del código fiscal",
  "views.researcher.lede": "El código del IRS, capítulo y versículo",
  "views.researcher.whatToResearch": "¿Qué puedo investigar?",
  "views.researcher.researching": "Investigando…",
  "views.researcher.placeholder": "Pregunta sobre el código fiscal del IRS…",
  "views.researcher.research": "Investigar",
  "views.researcher.attributed": "atribuido a {{name}}",
  "views.researcher.prompt.1": "¿Puedo deducir el internet de mi oficina en casa?",
  "views.researcher.prompt.2": "¿Cuáles son las reglas para deducir comidas de negocios?",
  "views.researcher.prompt.3": "¿Cuál es el tope de la deducción SALT y qué sección del código lo fija?",
  "views.researcher.prompt.4": "¿Puedo deducir mis primas de seguro médico en el Schedule C?",
  "views.researcher.prompt.5": "¿Qué cuenta como donación benéfica según el IRC §170?",
  "views.researcher.prompt.6": "¿Qué es el umbral del 7,5 % del AGI para gastos médicos?",
  "views.researcher.prompt.7": "¿Puedo deducir el kilometraje para ir a reuniones con clientes?",
  "views.researcher.prompt.8": "¿Cuáles son las reglas para depreciar equipos del negocio?",
  "views.researcher.quote.misesBoom": "No hay forma de evitar el colapso final de un auge provocado por la expansión del crédito.",
  "views.researcher.quote.hemingway": "La primera panacea de una nación mal gobernada es la inflación de la moneda; la segunda es la guerra.",
  "views.researcher.quote.friedman": "La inflación es un impuesto sin legislación.",
  "views.researcher.quote.morgan": "El oro es dinero. Todo lo demás es crédito.",
  "views.researcher.quote.colbert": "El arte de los impuestos consiste en desplumar al ganso de modo que se obtenga la mayor cantidad de plumas con la menor cantidad de graznidos.",
  "views.researcher.quote.bastiat": "El Estado es la gran ficción por la cual todo el mundo se esfuerza en vivir a costa de todo el mundo.",
  "views.researcher.quote.goldwater": "El impuesto sobre la renta creó más delincuentes que cualquier otro acto del gobierno.",
  "views.researcher.quote.parker": "Si quieres saber qué piensa Dios del dinero, mira a la gente a la que se lo dio.",
  "views.researcher.quote.lenin": "La manera de aplastar a la burguesía es molerla entre las piedras de los impuestos y la inflación.",
  "views.researcher.quote.greenspan": "Sin el patrón oro no hay manera de proteger el ahorro de la confiscación por inflación.",
  "views.researcher.quote.cicero": "El presupuesto debe equilibrarse, el Tesoro debe reponerse, la deuda pública debe reducirse.",
  "views.researcher.quote.paul": "La banca central es una forma de socialismo. Es la socialización del dinero y del crédito.",
  "views.researcher.quote.voltaire": "El papel moneda acaba volviendo a su valor intrínseco: cero.",
  "views.researcher.quote.galbraith": "El estudio del dinero es, más que cualquier otro campo de la economía, aquel en que la complejidad sirve para disfrazar la verdad o para evadirla.",
  "views.researcher.quote.ammous": "El dinero fiduciario es la causa principal de todas las crisis económicas.",
  "views.researcher.quote.gates": "Bitcoin es una proeza tecnológica.",
  "views.researcher.quote.satoshi": "El problema de fondo de la moneda convencional es toda la confianza que hace falta para que funcione.",
  "views.researcher.quote.shaw": "Un gobierno que le roba a Pedro para pagarle a Pablo siempre puede contar con el apoyo de Pablo.",

  "views.feedback.title": "Comentarios",
  "views.feedback.submitHeading": "Enviar comentarios",
  "views.feedback.intro": "Los informes de errores, las peticiones de funciones y las preguntas se siguen como Issues de GitHub. No necesitas cuenta de GitHub.",
  "views.feedback.cat.feedback": "Comentario general",
  "views.feedback.cat.bug": "Informe de error",
  "views.feedback.cat.feature": "Petición de función",
  "views.feedback.cat.question": "Pregunta",
  "views.feedback.titlePlaceholder": "Resumen corto…",
  "views.feedback.bodyPlaceholder": "Describe el problema, la idea o la pregunta…",
  "views.feedback.submitting": "Enviando…",
  "views.feedback.submit": "Enviar",
  "views.feedback.failed": "No se pudo crear la issue.",
  "views.feedback.recent": "Issues recientes",
  "views.feedback.state.open": "abierta",
  "views.feedback.state.closed": "cerrada",
  "views.feedback.state.submitted": "enviada",
  "views.feedback.comments_one": "{{count}} comentario",
  "views.feedback.comments_many": "{{count}} comentarios",
  "views.feedback.comments_other": "{{count}} comentarios",
  "views.feedback.none": "Aún no hay comentarios.",

  "views.settings.title": "Ajustes",
  "views.settings.timeout": "Tiempo de bloqueo",
  "views.settings.timeoutIntro": "Bloquea la app tras un rato sin actividad. Para desbloquearla hace falta tu frase de paso (la de tu inicio de sesión).",
  "views.settings.minutes_one": "{{count}} minuto",
  "views.settings.minutes_many": "{{count}} minutos",
  "views.settings.minutes_other": "{{count}} minutos",
  "views.settings.hour": "1 hora",
  "views.settings.never": "Nunca",
  "views.settings.current": "Actual: {{value}}",
  "views.settings.noTimeout": "Sin bloqueo",
  "views.settings.currentSession": "Sesión actual",
  "views.settings.about": "Acerca de",
  "views.settings.aboutWhat": "TaxSort MCP: clasificador de transacciones para los Schedules A y C",
  "views.settings.aboutPowered": "Funciona con Tollbooth DPYC · Neon Postgres · Claude AI",
  "views.settings.identity": "Identidad:",
  "views.settings.sharing": "Compartir: usa el mismo npub en varios dispositivos o entre varias personas.",

  "views.profile.heading": "Perfil",
  "views.profile.credit": "Saldo de crédito",
  "views.profile.timezone": "Zona horaria",
  "views.profile.timezoneNote": "Guardada en este dispositivo.",
  "views.profile.theme": "Tema",
  "views.profile.light": "Claro",
  "views.profile.dark": "Oscuro",
  "views.profile.system": "Sistema",
  "views.profile.language": "Idioma",
  "views.profile.aiHeading": "Uso de la IA para clasificar",
  "views.profile.aiNone": "Aún no hay clasificaciones registradas.",
  "views.profile.unknownModel": "desconocido",
  "views.profile.runs": "Pasadas:",
  "views.profile.calls": "Llamadas:",
  "views.profile.input": "Entrada:",
  "views.profile.output": "Salida:",
  "views.profile.cost": "Costo:",
  "views.profile.estimated": "Costo estimado de Anthropic",
  "views.profile.tokensAcross": "{{tokens}} tokens en {{calls}} llamadas a la API",
  "views.profile.inSats": "Equivalente en sats",
  "views.profile.sats": "{{count}} sats",
  "views.profile.atPrice": "a unos {{price}}/BTC",
  "views.profile.whyMatters": "<b>Por qué importa:</b> TaxSort usa Claude AI para clasificar las transacciones. El operador le paga a Anthropic esta capacidad de IA y traslada el costo a los patrones mediante micropagos Lightning en el Tollbooth.",
  "views.profile.transparency": "Tus créditos de peaje cubren el costo real de la IA más los gastos del operador. Ves exactamente lo que pagas: sin márgenes ocultos, sin trampas de suscripción.",

  "views.privacy.body": `# Política de privacidad de TaxSort

## Don't Pester Your Customer™ (DPYC™)

TaxSort se basa en la **filosofía DPYC™**, una ruptura clara con la forma en que el software suele tratar a sus usuarios. El principio es sencillo: *tu identidad, tus datos, tu dinero, tus reglas.*

Los productos SaaS habituales piden tu nombre, correo, teléfono, empleador, dirección y tarjeta antes de que puedas siquiera probarlos. Venden tus datos a intermediarios, los comparten con «socios» y te atan a suscripciones difíciles de cancelar a propósito. Te acosan con correos, notificaciones y trucos de diseño pensados para sacar el máximo dinero con el mínimo valor.

**DPYC™ rechaza todo esto.**

---

## Sin cuentas. Sin correo. Sin KYC.

TaxSort **no sabe nada de tu identidad real.** Nunca te pedimos tu:

- ❌ Nombre
- ❌ Correo electrónico
- ❌ Teléfono
- ❌ Dirección postal
- ❌ Número de la Seguridad Social
- ❌ Documento de identidad
- ❌ Tarjeta de crédito
- ❌ Cuenta bancaria

No hay **creación de cuenta, ni formulario de registro, ni contraseña.** No hay nada que hackear, nada que filtrar, nada que reclamar por orden judicial.

---

## Claves Nostr: tu identidad soberana

Tu identidad en TaxSort es un **par de claves Nostr**: una clave pública y una privada que creas tú, en tu propio dispositivo, sin pedir permiso a nadie.

### Tu npub (clave pública)
- Una cadena en bech32 que empieza por \`npub1...\`
- Puedes compartirla: es como TaxSort encuentra tus sesiones y tus datos
- Piensa en ella como la dirección de un buzón: cualquiera puede enviar ahí, pero solo tú puedes abrirlo

### Tu nsec (clave privada)
- Una cadena en bech32 que empieza por \`nsec1...\`
- **Nunca sale de tu dispositivo.** TaxSort nunca la pide, nunca la ve, nunca la guarda
- Sirve para firmar mensajes Nostr, lo que demuestra que eres dueño del npub correspondiente
- Piensa en ella como la llave de tu buzón: tenerla demuestra que es tuyo

### ¿Por qué claves Nostr?
- **Soberanas:** las creas tú. Ninguna autoridad las concede ni las retira.
- **Portátiles:** funcionan en cualquier app de Nostr. No están atadas a TaxSort.
- **Criptográficas:** se basan en la curva elíptica secp256k1 (la misma que Bitcoin). No se pueden falsificar.
- **Seudónimas:** atadas a las matemáticas, no a un registro del gobierno.

---

## Secure Courier: demostrar la propiedad sin compartir secretos

La primera vez que usas TaxSort, comprobamos que el npub es tuyo con **Secure Courier**, un intercambio de DM cifrados de Nostr:

1. TaxSort envía un mensaje directo de Nostr a tu npub
2. Respondes con la frase de paso que quieras
3. Tu respuesta va **firmada con tu nsec** (por tu cliente de Nostr, automáticamente)
4. La firma demuestra que el npub es tuyo, sin revelar nunca tu nsec

Es una **prueba de identidad de conocimiento cero.** Sabemos que alguien tiene la clave privada de ese npub. No sabemos nada más de quién es.

### Tu frase de paso protege tus datos
La frase de paso que eliges al verificarte sirve para derivar una clave de cifrado para los datos fiscales de nuestra base de datos. Esto significa:

- Las descripciones, importes y clasificaciones de tus transacciones están cifrados en reposo
- La clave de cifrado sale de *tu* frase de paso: no la elegimos nosotros
- Si olvidas tu frase de paso, tus datos no se pueden recuperar (así está pensado)

---

## Bloqueo por inactividad y desbloqueo

TaxSort se bloquea solo tras un tiempo sin actividad que puedes ajustar (15 minutos por defecto). Para desbloquear:

1. TaxSort envía un DM de Nostr a tu npub
2. Respondes "Approve Unlock"
3. Tu respuesta firmada demuestra que sigues siendo tú quien está frente al teclado

Así, quien se acerque a tu dispositivo desbloqueado no puede llegar a tus datos fiscales. El desbloqueo necesita **tu nsec** (por tu cliente de Nostr), no una contraseña que se pueda adivinar o leer por encima de tu hombro.

---

## Bitcoin Lightning: pagos sin procesadores de pago

TaxSort se paga con **micropagos de Bitcoin Lightning** mediante el protocolo Tollbooth DPYC™. Esto significa:

- **Sin tarjeta de crédito.** Ni Stripe ni PayPal: ningún procesador de pagos sabe que usas TaxSort.
- **Sin suscripción.** Prepagas un saldo de crédito y pagas por cada llamada a una herramienta. Para cuando quieras.
- **Sin burocracia de reembolsos.** Los créditos sin usar no caducan antes de 7 días. Sin renovaciones automáticas.
- **Sin vigilancia de pagos.** Los pagos Lightning van de persona a persona. Ninguna línea del extracto bancario dice «TaxSort».
- **Liquidación al instante.** Los créditos llegan en segundos, no en días.

### El Contrato Social DPYC™
TaxSort forma parte del [Contrato Social DPYC™](https://github.com/lonniev/dpyc-community), una red de servicios MCP gestionados de forma independiente que comparten estos principios. Cada operador tiene su propio servidor, fija sus propios precios y responde ante sus propios patrones. No hay autoridad central, ni comisión de plataforma, ni tajada de tienda de apps.

---

## Lo que guardamos

| Dato | Dónde | ¿Cifrado? | ¿Quién puede leerlo? |
|------|-------|-----------|-----------------|
| Tu npub | Neon Postgres | No (es público) | El operador |
| Estado de verificación | Neon Postgres | No | El operador |
| Hash de la frase de paso | Neon Postgres | Hash de un solo sentido | Nadie |
| Sesiones fiscales | Neon Postgres | En reposo | El operador + tú |
| Transacciones | Neon Postgres | En reposo | El operador + tú |
| Clasificaciones | Neon Postgres | En reposo | El operador + tú |
| Saldo de crédito | Neon Postgres | Cifrado | El operador |
| Facturas Lightning | BTCPay Server | Cifrado de BTCPay | El operador |

**No guardamos:** tu nsec, tu nombre real, tu correo, tu dirección IP (Cloudflare se encarga del enrutamiento), la huella de tu navegador, ni ninguna analítica o telemetría.

---

## Lo que enviamos a Claude AI

Cuando usas Categorizar o los asesores de IA, las descripciones e importes de tus transacciones van a la API Claude de Anthropic para clasificarse. Esto significa:

- Anthropic procesa el texto de tus transacciones de forma breve y no lo guarda para nosotros
- Se aplica la [política de conservación de datos](https://www.anthropic.com/privacy) de Anthropic
- Solo enviamos el contexto necesario (fecha, descripción, importe, cuenta)
- **No** enviamos a Anthropic tu npub, tu frase de paso ni nada que te identifique

---

## Lo que nunca haremos

- 🚫 Vender tus datos
- 🚫 Compartir tus datos con anunciantes
- 🚫 Exigir un documento de identidad
- 🚫 Informar a ninguna autoridad (no sabemos quién eres)
- 🚫 Enviarte correos publicitarios (no tenemos tu correo)
- 🚫 Renovar una suscripción por su cuenta (no hay suscripción)
- 🚫 Dejarte sin acceso a tus datos (están ligados a tu npub, que controlas tú)
- 🚫 Ponerte difícil irte (exporta tus datos cuando quieras, borra tu sesión cuando quieras)

---

## Código abierto y auditable

El código fuente de TaxSort es abierto:

- **Servidor MCP:** [github.com/lonniev/taxsort-mcp](https://github.com/lonniev/taxsort-mcp)
- **SDK de Tollbooth:** [github.com/lonniev/tollbooth-dpyc](https://github.com/lonniev/tollbooth-dpyc)
- **Licencia:** Apache 2.0

Puedes comprobar exactamente qué datos se recogen, cómo se guardan y qué se envía a dónde. No hay analíticas ocultas, ni píxeles de seguimiento, ni scripts de terceros.

---

*Don't Pester Your Customer™: porque tus datos fiscales no le importan a nadie más que a ti.*

*Inspirado en [The Phantom Tollbooth](https://en.wikipedia.org/wiki/The_Phantom_Tollbooth) de Norton Juster (1961).*
`,

  "lib.mcp.unknownError": "Error desconocido",
  "lib.classify.noKey": "No hay clave de API de Anthropic disponible.",
  "lib.classify.parseFailed": "Ronda {{round}}: no se pudo leer la respuesta de la IA",
  "lib.classify.outOfCredits": "El servicio de clasificación por IA se quedó sin créditos. Pide al operador de TaxSort que recargue su saldo de la API de Anthropic.",
  "lib.subscriptions.failed": "El análisis de suscripciones falló",
};

export default es;
