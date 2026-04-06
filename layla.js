// ============================================================
//  LAYLA — Assistente Virtual do Motel Lamore
//  Versão 2.0 | Ourinhos/SP
// ============================================================

const http  = require('http');
const https = require('https');

// ============================================================
//  CONFIGURAÇÕES — PREENCHA COM SEUS DADOS DO Z-API
// ============================================================
const CONFIG = {
  ZAPI_INSTANCE:     '3F10476A93B9C14397CFBA665B49BD70',
  ZAPI_TOKEN:        '060575DE041301E87AB1A483',
  ZAPI_CLIENT_TOKEN: 'F4cfafb1e17054b309e978e11d94ad1adS',
  NUMERO_DONO:       '5543996066590',
  PORTA:             3000,
};
// ============================================================

const FOTOS_URL = 'https://drive.google.com/drive/folders/1mW4xbKAGvySzm3SdGX_BLqBdiPOkwz2B';
const MAPS_URL  = 'https://maps.google.com/?q=Rua+Ana+Neri+501+Ourinhos+SP';
const TEL_REC   = '(14) 3324-6489';

// ============================================================
//  SESSOES POR CLIENTE
// ============================================================
const sessoes = {};

function getSessao(tel) {
  if (!sessoes[tel]) {
    sessoes[tel] = { etapa: 'menu', dados: {}, atendimento_humano: false };
  }
  return sessoes[tel];
}

// ============================================================
//  ENVIO DE MENSAGEM VIA Z-API
// ============================================================
function enviarMensagem(telefone, texto) {
  const body = JSON.stringify({ phone: telefone, message: texto });
  const opts = {
    hostname: 'api.z-api.io',
    path:     '/instances/' + CONFIG.ZAPI_INSTANCE + '/token/' + CONFIG.ZAPI_TOKEN + '/send-text',
    method:   'POST',
    headers: {
      'Content-Type':   'application/json',
      'Client-Token':   CONFIG.ZAPI_CLIENT_TOKEN,
      'Content-Length': Buffer.byteLength(body),
    },
  };
  const req = https.request(opts, function(res) {
    var d = '';
    res.on('data', function(c) { d += c; });
    res.on('end', function() { console.log('[ENVIADO -> ' + telefone + '] status ' + res.statusCode); });
  });
  req.on('error', function(e) { console.error('[ERRO envio]', e.message); });
  req.write(body);
  req.end();
}

// ============================================================
//  ALERTAS INTERNOS AO DONO
// ============================================================
function alertarDono(tipo, telefoneCliente, mensagemCliente, dadosExtras) {
  var hora   = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  var icones = { reclamacao: 'RECLAMACAO', esquecido: 'ITEM ESQUECIDO', decoracao: 'RESERVA DECORACAO', atendente: 'ATENDENTE SOLICITADO' };

  var alerta =
    '*ALERTA LAMORE*\n' +
    'Tipo: ' + icones[tipo] + '\n' +
    'Cliente: ' + telefoneCliente + '\n' +
    'Mensagem: "' + mensagemCliente + '"\n' +
    'Hora: ' + hora;

  if (dadosExtras) {
    alerta += '\n\nDados da reserva:\n' + dadosExtras;
  }

  enviarMensagem(CONFIG.NUMERO_DONO, alerta);
  console.log('[ALERTA DONO] ' + icones[tipo] + ' - cliente ' + telefoneCliente);
}

// ============================================================
//  TEXTOS DAS SUITES
// ============================================================
var SUITE_STANDART =
  'Suite Standart\n\n' +
  'Conforto e aconchego para uma pausa especial.\n\n' +
  'TV\n' +
  'Ar-condicionado\n' +
  'Frigobar\n' +
  'Ducha higienica (nao possui chuveiro)\n' +
  'Estacionamento coberto e privativo\n\n' +
  '2 horas:\n' +
  'Semana (seg 6h ate qui 18h): R$ 50,00 (hora adicional R$ 20,00)\n' +
  'Fim de semana (qui 18h ate seg 6h): R$ 55,00 (hora adicional R$ 20,00)\n\n' +
  'Entrada direta, 24 horas!\n\n' +
  'Dica: por apenas R$ 30,00 a mais, a Suite Luxo tem chuveiro e opcao de pernoite. Digite 3 para conhecer!';

var SUITE_LUXO =
  'Suite Luxo\n\n' +
  'Sofisticacao e bem-estar com exclusividade.\n\n' +
  'TV\n' +
  'Ar-condicionado\n' +
  'Frigobar\n' +
  'Chuveiro\n' +
  'Estacionamento coberto e privativo\n\n' +
  '2 horas:\n' +
  'Semana (seg 6h ate qui 18h): R$ 80,00 (hora adicional R$ 35,00)\n' +
  'Fim de semana (qui 18h ate seg 6h): R$ 85,00 (hora adicional R$ 35,00)\n\n' +
  'Pernoite (12h):\n' +
  'Semana: R$ 179,00\n' +
  'Fim de semana: R$ 269,00\n\n' +
  'Com decoracao especial: a partir de R$ 329,00\n\n' +
  'Dica: a Suite Hidro tem hidromassagem privativa. Digite 4 para conhecer!';

var SUITE_HIDRO =
  'Suite Hidro\n\n' +
  'Hidromassagem privativa para momentos inesqueciveis.\n\n' +
  'Hidromassagem\n' +
  'Chuveiro\n' +
  'Ar-condicionado\n' +
  'TV\n' +
  'Frigobar\n' +
  'Estacionamento coberto e privativo\n\n' +
  '2 horas:\n' +
  'Semana (seg 6h ate qui 18h): R$ 149,00 (hora adicional R$ 70,00)\n' +
  'Fim de semana (qui 18h ate seg 6h): R$ 169,00 (hora adicional R$ 70,00)\n\n' +
  'Pernoite (12h):\n' +
  'Semana: R$ 299,00\n' +
  'Fim de semana: R$ 419,00\n\n' +
  'Com decoracao especial: a partir de R$ 529,00\n\n' +
  'Dica: a Hidro Premium e nossa suite mais exclusiva. Digite 5 para conhecer!';

var SUITE_PREMIUM =
  'Hidro Premium\n\n' +
  'Nossa suite mais exclusiva. Maximo em bem-estar e privacidade.\n\n' +
  'Hidromassagem premium\n' +
  'Chuveiro\n' +
  'Ar-condicionado\n' +
  'TV\n' +
  'Frigobar\n' +
  'Estacionamento coberto e privativo\n\n' +
  '2 horas:\n' +
  'Semana (seg 6h ate qui 18h): R$ 165,00 (hora adicional R$ 40,00)\n' +
  'Fim de semana (qui 18h ate seg 6h): R$ 185,00 (hora adicional R$ 40,00)\n\n' +
  'Pernoite (12h):\n' +
  'Semana: R$ 329,00\n' +
  'Fim de semana: R$ 439,00\n\n' +
  'Com decoracao especial: a partir de R$ 549,00\n\n' +
  'A escolha perfeita para quem quer o melhor!';

// ============================================================
//  MENSAGENS FIXAS
// ============================================================
var MENU_PRINCIPAL =
  'Ola! Seja muito bem-vindo ao Motel Lamore\n\n' +
  'Somos referencia em bem-estar e exclusividade em Ourinhos/SP.\n\n' +
  'Como posso te ajudar? Digite o numero:\n\n' +
  '1 - Ver suites e precos\n' +
  '2 - Suite Standart\n' +
  '3 - Suite Luxo\n' +
  '4 - Suite Hidro\n' +
  '5 - Hidro Premium\n' +
  '6 - Ver fotos\n' +
  '7 - Decoracao especial\n' +
  '8 - Disponibilidade de quartos\n' +
  '9 - Como chegar\n' +
  '0 - Falar com atendente';

var MENU_SUITES =
  'Nossas suites:\n\n' +
  'Standart - a partir de R$ 50,00 (2h)\n' +
  'Luxo - a partir de R$ 80,00 (2h) | R$ 179,00 (pernoite)\n' +
  'Hidro - a partir de R$ 149,00 (2h) | R$ 299,00 (pernoite)\n' +
  'Hidro Premium - a partir de R$ 165,00 (2h) | R$ 329,00 (pernoite)\n\n' +
  'Nossos periodos:\n' +
  'Semana: segunda as 6h ate quinta as 18h\n' +
  'Fim de semana: quinta as 18h ate segunda as 6h\n\n' +
  'Digite o numero da suite:\n' +
  '2 - Standart | 3 - Luxo | 4 - Hidro | 5 - Premium';

var HORARIOS_MSG =
  'Horarios e valores do Motel Lamore\n\n' +
  'Periodo Semana:\n' +
  'Segunda-feira as 6h ate Quinta-feira as 18h\n\n' +
  'Periodo Fim de Semana:\n' +
  'Quinta-feira as 18h ate Segunda-feira as 6h\n\n' +
  'Valores por suite:\n\n' +
  'Standart - 2h: R$ 50,00 (sem) | R$ 55,00 (fds)\n' +
  'Luxo - 2h: R$ 80,00 (sem) | R$ 85,00 (fds)\n' +
  '       Pernoite: R$ 179,00 (sem) | R$ 269,00 (fds)\n' +
  'Hidro - 2h: R$ 149,00 (sem) | R$ 169,00 (fds)\n' +
  '        Pernoite: R$ 299,00 (sem) | R$ 419,00 (fds)\n' +
  'Premium - 2h: R$ 165,00 (sem) | R$ 185,00 (fds)\n' +
  '          Pernoite: R$ 329,00 (sem) | R$ 439,00 (fds)\n\n' +
  'Funcionamos 24 horas, todos os dias!';

var DECORACAO_MSG =
  'Decoracao Especial Lamore\n\n' +
  'Transformamos a suite num cenario unico e inesquecivel:\n\n' +
  'Cobertor vermelho\n' +
  'Lencol personalizado com frase a sua escolha:\n' +
  '- Parabens pelo seu aniversario\n' +
  '- Parabens pelo nosso aniversario de casamento\n' +
  '- Felicidades aos noivos\n' +
  '- Eu te amo\n' +
  '- Quer casar comigo?\n' +
  '- Quer namorar comigo?\n' +
  '- Vamos brindar o amor\n' +
  '- Voce me faz feliz\n\n' +
  '2 baloes metalicos coracao + 15 bexigas\n' +
  'Petalas de rosas artificiais e naturais\n' +
  'Velas decorativas LED + aparador\n' +
  '2 pacotes de bombons\n' +
  'Toalhas e tapetes personalizados\n' +
  'Espumante no balde com gelo + 2 tacas\n\n' +
  'Reserva com minimo 36h de antecedencia.\n\n' +
  'Para qual suite voce gostaria de reservar?\n' +
  '3 - Luxo | 4 - Hidro | 5 - Premium\n\n' +
  'Ou escreva "reservar" para iniciar o agendamento agora.';

// ============================================================
//  VERIFICACAO DE PALAVRAS-CHAVE
// ============================================================
function contem(texto, palavras) {
  var t = texto.toLowerCase();
  for (var i = 0; i < palavras.length; i++) {
    if (t.indexOf(palavras[i]) !== -1) return true;
  }
  return false;
}

var KW_RECLAMACAO  = ['reclamacao','reclamar','problema','pessimo','horrivel','insatisfeito','decepcionado','nao gostei','sujo','quebrado','errado','ruim','reclamação','péssimo','horrível'];
var KW_ESQUECIDO   = ['esqueci','esquecido','esqueceu','deixei','objeto perdido','bolsa','carteira','celular','chave','documento','oculos','roupa','pertence','óculos'];
var KW_FOTO        = ['foto','fotos','imagem','imagens','como e','mostra','quero ver','aparencia','ver as fotos'];
var KW_CHEGAR      = ['endereco','onde fica','localizacao','como chegar','mapa','endereço','localização'];
var KW_DISPONIVEL  = ['disponivel','disponibilidade','tem quarto','tem vaga','livre','vago','ocupado','disponível'];
var KW_ATENDENTE   = ['atendente','humano','falar com','quero falar','me ajuda'];
var KW_NUMERO_PRIV = ['numero do dono','seu numero','numero interno','43996','99606','numero privado','número do dono','número privado'];
var KW_RESERVAR    = ['quero reservar','fazer reserva','quero agendar','reservar decoracao','reservar decoração'];
var KW_HORARIO     = ['horario','preco','valor','valores','periodo','tabela','horários','horário','preço','período'];
var KW_OI          = ['oi','ola','bom dia','boa tarde','boa noite','hello','hi','hey','menu','inicio','comeco','ajuda','olá','início'];

// ============================================================
//  FLUXO DE RESERVA COM DECORACAO
// ============================================================
function processarReserva(tel, texto, sessao) {
  var etapa = sessao.etapa;

  if (etapa === 'reserva_suite') {
    sessao.dados.suite = texto;
    sessao.etapa = 'reserva_data';
    enviarMensagem(tel, 'Qual a data e horario desejados?\n(Ex: 15/07/2025 as 20h)');
    return;
  }

  if (etapa === 'reserva_data') {
    sessao.dados.data = texto;
    sessao.etapa = 'reserva_espumante';
    enviarMensagem(tel, 'Qual espumante voce prefere?\n\n1 - Chuva de Prata\n2 - Santa Colina');
    return;
  }

  if (etapa === 'reserva_espumante') {
    if (texto === '1') {
      sessao.dados.espumante = 'Chuva de Prata';
    } else if (texto === '2') {
      sessao.dados.espumante = 'Santa Colina';
    } else {
      sessao.dados.espumante = texto;
    }
    sessao.etapa = 'reserva_frase';
    enviarMensagem(tel,
      'Qual frase voce quer no lencol personalizado?\n\n' +
      'Exemplos:\n' +
      '- Eu te amo\n' +
      '- Parabens pelo nosso aniversario\n' +
      '- Quer casar comigo?\n\n' +
      'Ou escreva a sua propria!'
    );
    return;
  }

  if (etapa === 'reserva_frase') {
    sessao.dados.frase = texto;

    var resumo =
      'Resumo da sua reserva:\n\n' +
      'Suite: ' + sessao.dados.suite + '\n' +
      'Data/hora: ' + sessao.dados.data + '\n' +
      'Espumante: ' + sessao.dados.espumante + '\n' +
      'Frase: "' + sessao.dados.frase + '"\n\n' +
      'Dados recebidos! Um atendente ira confirmar sua reserva em breve.';

    enviarMensagem(tel, resumo);

    var dadosAlerta =
      'Suite: ' + sessao.dados.suite + '\n' +
      'Data/hora: ' + sessao.dados.data + '\n' +
      'Espumante: ' + sessao.dados.espumante + '\n' +
      'Frase: "' + sessao.dados.frase + '"';

    alertarDono('decoracao', tel, 'Reserva com decoracao solicitada', dadosAlerta);

    sessao.etapa = 'menu';
    sessao.dados = {};
    return;
  }
}

// ============================================================
//  PROCESSADOR PRINCIPAL DE MENSAGENS
// ============================================================
function processarMensagem(tel, textoOriginal) {
  var texto  = textoOriginal.trim();
  var txtMin = texto.toLowerCase();
  var sessao = getSessao(tel);

  console.log('[MSG] ' + tel + ': "' + texto + '" | etapa: ' + sessao.etapa + ' | humano: ' + sessao.atendimento_humano);

  // 1. Pausado por atendimento humano
  if (sessao.atendimento_humano) {
    console.log('[PAUSADO] ' + tel + ' em atendimento humano');
    return;
  }

  // 2. Protecao numero privado
  if (contem(texto, KW_NUMERO_PRIV)) {
    enviarMensagem(tel, 'Nao tenho essa informacao disponivel. Posso te ajudar com nossas suites, precos ou agendamentos!');
    return;
  }

  // 3. Fluxo de reserva em andamento
  if (sessao.etapa.indexOf('reserva_') === 0) {
    processarReserva(tel, texto, sessao);
    return;
  }

  // 4. Reclamacao
  if (contem(texto, KW_RECLAMACAO)) {
    alertarDono('reclamacao', tel, texto, null);
    sessao.atendimento_humano = true;
    enviarMensagem(tel,
      'Lamentamos muito que sua experiencia nao tenha sido a esperada.\n\n' +
      'Sua satisfacao e muito importante para nos. Estou chamando um atendente agora. Aguarde!'
    );
    return;
  }

  // 5. Item esquecido
  if (contem(texto, KW_ESQUECIDO)) {
    alertarDono('esquecido', tel, texto, null);
    sessao.atendimento_humano = true;
    enviarMensagem(tel,
      'Vamos te ajudar a recuperar seu item o quanto antes!\n\n' +
      'Estou chamando um atendente que ira verificar e providenciar a devolucao. Aguarde!'
    );
    return;
  }

  // 6. Atendente solicitado
  if (contem(texto, KW_ATENDENTE) || txtMin === '0') {
    alertarDono('atendente', tel, texto, null);
    sessao.atendimento_humano = true;
    enviarMensagem(tel, 'Certo! Estou chamando um atendente. Em breve alguem ira te responder.');
    return;
  }

  // 7. Iniciar reserva com decoracao
  if (contem(texto, KW_RESERVAR) || txtMin === 'reservar') {
    sessao.etapa = 'reserva_suite';
    enviarMensagem(tel,
      'Reserva com Decoracao Especial\n\n' +
      'Otimo! Para qual suite voce gostaria de reservar?\n' +
      '- Luxo\n- Hidro\n- Hidro Premium'
    );
    return;
  }

  // 8. Fotos
  if (contem(texto, KW_FOTO) || txtMin === '6') {
    enviarMensagem(tel, 'Galeria de fotos do Motel Lamore:\n' + FOTOS_URL);
    sessao.etapa = 'menu';
    return;
  }

  // 9. Como chegar
  if (contem(texto, KW_CHEGAR) || txtMin === '9') {
    enviarMensagem(tel,
      'Motel Lamore\n' +
      'Rua Ana Neri, 501 - Ourinhos/SP\n\n' +
      'Estacionamento coberto e privativo, total discricao garantida.\n\n' +
      'Abertos 24 horas!\n\n' +
      MAPS_URL
    );
    sessao.etapa = 'menu';
    return;
  }

  // 10. Disponibilidade
  if (contem(texto, KW_DISPONIVEL) || txtMin === '8') {
    enviarMensagem(tel,
      'Para verificar a disponibilidade entre em contato com nossa recepcao:\n\n' +
      TEL_REC + '\n\nAtendemos 24 horas, todos os dias!'
    );
    sessao.etapa = 'menu';
    return;
  }

  // 11. Decoracao especial
  if (txtMin === '7' || contem(texto, ['decoracao','decoracao especial','decoração','decoração especial'])) {
    enviarMensagem(tel, DECORACAO_MSG);
    sessao.etapa = 'menu';
    return;
  }

  // 12. Horarios e precos
  if (contem(texto, KW_HORARIO)) {
    enviarMensagem(tel, HORARIOS_MSG);
    sessao.etapa = 'menu';
    return;
  }

  // 13. Menu de suites
  if (txtMin === '1' || contem(texto, ['ver suites','ver suítes','suites e precos','suítes e preços'])) {
    enviarMensagem(tel, MENU_SUITES);
    sessao.etapa = 'menu';
    return;
  }

  // 14. Suites individuais
  if (txtMin === '2' || contem(texto, ['standart','standard','suite standart','suíte standart'])) {
    enviarMensagem(tel, SUITE_STANDART);
    sessao.etapa = 'menu';
    return;
  }
  if (txtMin === '3' || contem(texto, ['suite luxo','suíte luxo','luxo'])) {
    enviarMensagem(tel, SUITE_LUXO);
    sessao.etapa = 'menu';
    return;
  }
  if (txtMin === '4' || contem(texto, ['suite hidro','suíte hidro','hidromassagem','hidro'])) {
    enviarMensagem(tel, SUITE_HIDRO);
    sessao.etapa = 'menu';
    return;
  }
  if (txtMin === '5' || contem(texto, ['hidro premium','suite premium','suíte premium','premium'])) {
    enviarMensagem(tel, SUITE_PREMIUM);
    sessao.etapa = 'menu';
    return;
  }

  // 15. Saudacao / menu inicial
  if (contem(texto, KW_OI) || sessao.etapa === 'menu') {
    enviarMensagem(tel, MENU_PRINCIPAL);
    sessao.etapa = 'aguardando';
    return;
  }

  // 16. Fallback
  enviarMensagem(tel,
    'Nao entendi muito bem.\n\n' +
    'Digite um numero do menu:\n\n' +
    '1 - Ver suites | 2 a 5 - Suites especificas\n' +
    '6 - Fotos | 7 - Decoracao\n' +
    '8 - Disponibilidade | 9 - Como chegar | 0 - Atendente'
  );
}

// ============================================================
//  SERVIDOR HTTP
// ============================================================
var server = http.createServer(function(req, res) {
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(200);
    res.end('Layla - Motel Lamore online');
    return;
  }

  var body = '';
  req.on('data', function(chunk) { body += chunk; });
  req.on('end', function() {
    try {
      var payload    = JSON.parse(body);
      var textoMsg   = '';
      var telMsg     = payload.phone || payload.from || payload.to || '';

      if (payload.text && payload.text.message) {
        textoMsg = payload.text.message;
      } else if (payload.body) {
        textoMsg = payload.body;
      }

      // Mensagem enviada pelo atendente
      if (payload.fromMe) {
        var telCliente = payload.phone || payload.to || '';
        var txtEnv     = textoMsg.trim().toLowerCase();

        if (txtEnv === 'atendimento encerrado') {
          if (sessoes[telCliente]) {
            sessoes[telCliente].atendimento_humano = false;
            sessoes[telCliente].etapa = 'menu';
          }
          console.log('[REATIVADO] Layla reativada para ' + telCliente);
        } else if (telCliente && textoMsg) {
          if (!sessoes[telCliente]) {
            sessoes[telCliente] = { etapa: 'menu', dados: {}, atendimento_humano: false };
          }
          if (!sessoes[telCliente].atendimento_humano) {
            sessoes[telCliente].atendimento_humano = true;
            console.log('[PAUSADO] Layla pausada para ' + telCliente);
          }
        }
        res.writeHead(200);
        res.end('ok');
        return;
      }

      // Mensagem recebida do cliente
      if (telMsg && textoMsg) {
        processarMensagem(telMsg, textoMsg);
      }

    } catch (e) {
      console.error('[ERRO webhook]', e.message);
    }
    res.writeHead(200);
    res.end('ok');
  });
});

server.listen(CONFIG.PORTA, function() {
  console.log('');
  console.log('LAYLA - Assistente Virtual Motel Lamore');
  console.log('Servidor rodando na porta ' + CONFIG.PORTA);
  console.log('');
  if (CONFIG.ZAPI_INSTANCE === 'SEU_INSTANCE_ID') {
    console.log('ATENCAO: Preencha a secao CONFIG com seus dados do Z-API!');
  }
});
