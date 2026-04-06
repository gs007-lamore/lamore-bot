// ============================================================
//  LAYLA - Assistente Virtual do Motel Lamore
//  Versao 1.0 | Ourinhos/SP
// ============================================================

const http  = require('http');
const https = require('https');

const CONFIG = {
  ZAPI_INSTANCE:     '3F10476A93B9C14397CFBA665B49BD70',
  ZAPI_TOKEN:        '060575DE041301E87AB1A483',
  ZAPI_CLIENT_TOKEN: 'F4cfafb1e17054b309e978e11d94ad1adS',
  NUMERO_DONO:       '5543996066590',
  PORTA:             process.env.PORT || 3000,
};

const FOTOS_URL = 'https://drive.google.com/drive/folders/1mW4xbKAGvySzm3SdGX_BLqBdiPOkwz2B';
const MAPS_URL  = 'https://maps.google.com/?q=Rua+Ana+Neri+501+Ourinhos+SP';
const TEL_REC   = '(14) 3324-6489';
const sessoes   = {};

function getSessao(tel) {
  if (!sessoes[tel]) sessoes[tel] = { etapa: 'menu', dados: {} };
  return sessoes[tel];
}

function enviarMensagem(telefone, texto) {
  const body = JSON.stringify({ phone: telefone, message: texto });
  const opts = {
    hostname: 'api.z-api.io',
    path: `/instances/${CONFIG.ZAPI_INSTANCE}/token/${CONFIG.ZAPI_TOKEN}/send-text`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Token': CONFIG.ZAPI_CLIENT_TOKEN,
      'Content-Length': Buffer.byteLength(body),
    },
  };
  const req = https.request(opts, res => {
    res.on('data', () => {});
    res.on('end', () => console.log(`[ENVIADO -> ${telefone}] status ${res.statusCode}`));
  });
  req.on('error', e => console.error('[ERRO]', e.message));
  req.write(body);
  req.end();
}

function alertarDono(tipo, tel, msg, extras) {
  const hora   = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const icones = { reclamacao: '🔴', esquecido: '🟡', decoracao: '🟢' };
  const labels  = { reclamacao: 'Reclamacao de cliente', esquecido: 'Item esquecido', decoracao: 'Reserva com decoracao' };
  let alerta = `${icones[tipo]} *ALERTA LAMORE*\nTipo: ${labels[tipo]}\nCliente: ${tel}\nMensagem: "${msg}"\nHorario: ${hora}`;
  if (extras) alerta += `\n\nDados:\n${extras}`;
  enviarMensagem(CONFIG.NUMERO_DONO, alerta);
}

function contem(texto, palavras) {
  const t = texto.toLowerCase();
  return palavras.some(p => t.includes(p));
}

const SUITES = {
  standart: '🛏 *Suite Standart*\n\nConforto e aconchego para uma pausa especial.\n\n✅ TV\n✅ Ar-condicionado\n✅ Frigobar\n✅ Ducha higienica (nao possui chuveiro)\n🚗 Estacionamento coberto e privativo\n\n💰 *2 horas:*\n• Semana: R$ 50,00 (hora add. R$ 20)\n• Fim de semana: R$ 55,00 (hora add. R$ 20)\n\n⏰ Entrada direta, 24 horas!\n\n✨ Dica: por apenas R$ 30 a mais a Suite Luxo tem chuveiro e pernoite. Digite 3 para conhecer!',
  luxo:     '✨ *Suite Luxo*\n\nSofisticacao e bem-estar com exclusividade.\n\n✅ TV\n✅ Ar-condicionado\n✅ Frigobar\n✅ Chuveiro\n🚗 Estacionamento coberto e privativo\n\n💰 *2 horas:*\n• Semana: R$ 80,00 / FDS: R$ 85,00 (hora add. R$ 35)\n\n🌙 *Pernoite (12h):*\n• Semana: R$ 179,00 / FDS: R$ 269,00\n\n🌹 Com decoracao especial: a partir de R$ 329,00\n\n✨ Dica: a Suite Hidro tem hidromassagem privativa. Digite 4 para conhecer!',
  hidro:    '🛁 *Suite Hidro*\n\nHidromassagem privativa para momentos inesqueciveis.\n\n✅ Hidromassagem\n✅ Chuveiro\n✅ Ar-condicionado\n✅ TV\n✅ Frigobar\n🚗 Estacionamento coberto e privativo\n\n💰 *2 horas:*\n• Semana: R$ 149,00 / FDS: R$ 169,00 (hora add. R$ 70)\n\n🌙 *Pernoite (12h):*\n• Semana: R$ 299,00 / FDS: R$ 419,00\n\n🌹 Com decoracao especial: a partir de R$ 529,00\n\n✨ Dica: para o maximo, a Hidro Premium e nossa suite top. Digite 5 para conhecer!',
  premium:  '👑 *Hidro Premium*\n\nNossa suite mais exclusiva. Maximo em bem-estar e privacidade.\n\n✅ Hidromassagem premium\n✅ Chuveiro\n✅ Ar-condicionado\n✅ TV\n✅ Frigobar\n🚗 Estacionamento coberto e privativo\n\n💰 *2 horas:*\n• Semana: R$ 165,00 / FDS: R$ 185,00 (hora add. R$ 40)\n\n🌙 *Pernoite (12h):*\n• Semana: R$ 329,00 / FDS: R$ 439,00\n\n🌹 Com decoracao especial: a partir de R$ 549,00\n\n🏆 A escolha perfeita para quem quer o melhor!',
};

const MENU = 'Ola! Seja muito bem-vindo ao *Motel Lamore* 🌹\n\nSomos referencia em bem-estar e exclusividade em Ourinhos/SP.\n\nComo posso te ajudar? Digite o numero:\n\n1 - Ver suites e precos\n2 - Suite Standart\n3 - Suite Luxo\n4 - Suite Hidro\n5 - Hidro Premium\n6 - Ver fotos\n7 - Decoracao especial\n8 - Disponibilidade de quartos\n9 - Como chegar\n0 - Falar com atendente';

const DECORACAO = '🌹 *Decoracao Especial Lamore*\n\nTransformamos a suite num cenario unico:\n\n🛏 Cobertor vermelho\n🛏 Lencol personalizado com frase a sua escolha\n🎈 2 baloes metalicos coracao + 15 bexigas\n🌹 Petalas de rosas artificiais e naturais\n🕯 Velas decorativas LED + aparador\n🍫 2 pacotes de bombons\n🛁 Toalhas e tapetes personalizados\n🍾 Espumante no balde com gelo + 2 tacas\n\n📌 *Reserva com minimo 36h de antecedencia.*\n\nPara qual suite voce gostaria de reservar? (Luxo, Hidro ou Hidro Premium)\n\nOu digite *reservar* para iniciar o agendamento.';

function processarReserva(tel, texto, sessao) {
  if (sessao.etapa === 'reserva_suite') {
    sessao.dados.suite = texto;
    sessao.etapa = 'reserva_data';
    enviarMensagem(tel, '📅 Qual a *data e horario* desejados?\nEx: 15/07/2025 as 20h');
  } else if (sessao.etapa === 'reserva_data') {
    sessao.dados.data = texto;
    sessao.etapa = 'reserva_espumante';
    enviarMensagem(tel, '🍾 Qual espumante voce prefere?\n\n1 - Chuva de Prata\n2 - Santa Colina');
  } else if (sessao.etapa === 'reserva_espumante') {
    sessao.dados.espumante = texto === '1' ? 'Chuva de Prata' : texto === '2' ? 'Santa Colina' : texto;
    sessao.etapa = 'reserva_frase';
    enviarMensagem(tel, '💬 Qual *frase* voce quer no lencol personalizado?\nEx: Eu te amo / Quer casar comigo?');
  } else if (sessao.etapa === 'reserva_frase') {
    sessao.dados.frase = texto;
    sessao.etapa = 'menu';
    const resumo = `📋 *Resumo da reserva:*\n\nSuite: ${sessao.dados.suite}\nData/hora: ${sessao.dados.data}\nEspumante: ${sessao.dados.espumante}\nFrase: "${sessao.dados.frase}"\n\n✅ Dados recebidos! Um atendente ira confirmar em breve. 🌹`;
    enviarMensagem(tel, resumo);
    alertarDono('decoracao', tel, 'Reserva com decoracao solicitada', `Suite: ${sessao.dados.suite}\nData/hora: ${sessao.dados.data}\nEspumante: ${sessao.dados.espumante}\nFrase: "${sessao.dados.frase}"`);
    sessao.dados = {};
  }
}

function processarMensagem(tel, textoOriginal) {
  const texto  = textoOriginal.trim();
  const sessao = getSessao(tel);
  console.log(`[MSG] ${tel}: "${texto}" | etapa: ${sessao.etapa}`);

  if (contem(texto, ['numero do dono','seu numero','numero interno','43996','99606'])) {
    enviarMensagem(tel, 'Nao tenho essa informacao disponivel 😊 Posso te ajudar com suites, precos ou agendamentos!');
    return;
  }

  if (sessao.etapa.startsWith('reserva_')) { processarReserva(tel, texto, sessao); return; }

  if (contem(texto, ['reclamacao','reclamar','problema','pessimo','horrivel','insatisfeito','nao gostei','sujo','quebrado','ruim'])) {
    alertarDono('reclamacao', tel, texto, null);
    enviarMensagem(tel, 'Lamentamos muito 😔 Sua satisfacao e muito importante para nos. Estou chamando um atendente agora para resolver isso da melhor forma. Aguarde!');
    return;
  }

  if (contem(texto, ['esqueci','esquecido','deixei','bolsa','carteira','celular','chave','documento','oculos','roupa'])) {
    alertarDono('esquecido', tel, texto, null);
    enviarMensagem(tel, 'Que situacao chata! Vamos te ajudar a recuperar seu item 😊 Estou chamando um atendente. Aguarde!');
    return;
  }

  if (contem(texto, ['reservar','reserva','agendar']) || texto === 'reservar') {
    sessao.etapa = 'reserva_suite';
    enviarMensagem(tel, '🌹 *Reserva com Decoracao Especial*\n\nPara qual suite voce gostaria de reservar?\n• Luxo\n• Hidro\n• Hidro Premium');
    return;
  }

  if (contem(texto, ['foto','fotos','imagem','ver','mostra']) || texto === '6') { enviarMensagem(tel, `📸 *Galeria de fotos do Motel Lamore*\n\n${FOTOS_URL}`); return; }
  if (contem(texto, ['endereco','onde fica','localizacao','como chegar','chegar','mapa']) || texto === '9') { enviarMensagem(tel, `📍 *Motel Lamore*\nRua Ana Neri, 501 - Ourinhos/SP\n\n🚗 Estacionamento coberto e privativo.\n\nAbertos 24 horas! 😊\n\n${MAPS_URL}`); return; }
  if (contem(texto, ['disponivel','disponibilidade','tem quarto','tem vaga']) || texto === '8') { enviarMensagem(tel, `Para verificar disponibilidade:\n\n📞 *${TEL_REC}*\n\nAtendemos 24 horas!`); return; }
  if (contem(texto, ['atendente','humano','falar com']) || texto === '0') { enviarMensagem(tel, 'Certo! Estou chamando um atendente. Aguarde 😊'); alertarDono('reclamacao', tel, `Solicitou atendente: "${texto}"`, null); return; }
  if (texto === '7' || contem(texto, ['decoracao'])) { enviarMensagem(tel, DECORACAO); return; }
  if (texto === '1' || contem(texto, ['ver suites','suites','precos'])) { enviarMensagem(tel, '🌹 *Nossas suites:*\n\n🛏 *Standart* - a partir de R$ 50 (2h)\n✨ *Luxo* - a partir de R$ 80 (2h) | R$ 179 (pernoite)\n🛁 *Hidro* - a partir de R$ 149 (2h) | R$ 299 (pernoite)\n👑 *Hidro Premium* - a partir de R$ 165 (2h) | R$ 329 (pernoite)\n\nDigite o numero: 2-Standart | 3-Luxo | 4-Hidro | 5-Premium'); return; }
  if (texto === '2' || contem(texto, ['standart','standard'])) { enviarMensagem(tel, SUITES.standart); return; }
  if (texto === '3' || contem(texto, ['luxo'])) { enviarMensagem(tel, SUITES.luxo); return; }
  if (texto === '4' || contem(texto, ['hidro','hidromassagem'])) { enviarMensagem(tel, SUITES.hidro); return; }
  if (texto === '5' || contem(texto, ['premium'])) { enviarMensagem(tel, SUITES.premium); return; }
  if (contem(texto, ['oi','ola','bom dia','boa tarde','boa noite','menu','inicio']) || sessao.etapa === 'menu') { enviarMensagem(tel, MENU); sessao.etapa = 'aguardando'; return; }

  enviarMensagem(tel, 'Nao entendi muito bem 😊\n\nDigite um numero:\n1-Suites | 6-Fotos | 7-Decoracao\n8-Disponibilidade | 9-Endereco | 0-Atendente');
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        if (payload.fromMe) { res.writeHead(200); res.end('ok'); return; }
        const tel   = payload.phone || payload.from || '';
        const texto = payload.text?.message || payload.body || '';
        if (tel && texto) processarMensagem(tel, texto);
      } catch (e) { console.error('[ERRO]', e.message); }
      res.writeHead(200); res.end('ok');
    });
  } else {
    res.writeHead(200); res.end('Layla - Motel Lamore online 🌹');
  }
});

server.listen(CONFIG.PORTA, () => {
  console.log('\n🌹 ============================================');
  console.log('   LAYLA - Assistente Virtual Motel Lamore');
  console.log('   Porta: ' + CONFIG.PORTA);
  console.log('🌹 ============================================\n');
});
