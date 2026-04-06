// ============================================================
//  LAYLA - Assistente Virtual do Motel Lamore
//  Versao 3.0 | Ourinhos/SP
// ============================================================

const http  = require(‘http’);
const https = require(‘https’);

// ============================================================
//  CONFIGURACOES - PREENCHA COM SEUS DADOS DO Z-API
// ============================================================
const CONFIG = {
ZAPI_INSTANCE:     ‘3F10476A93B9C14397CFBA665B49BD70’,
ZAPI_TOKEN:        ‘060575DE041301E87AB1A483’,
ZAPI_CLIENT_TOKEN: ‘F4cfafb1e17054b309e978e11d94ad1adS’,
NUMERO_DONO:       ‘5543996066590’,
PORTA: process.env.PORT || 3000,


};
// ============================================================

const FOTOS_URL = ‘https://drive.google.com/drive/folders/1mW4xbKAGvySzm3SdGX_BLqBdiPOkwz2B’;
const MAPS_URL  = ‘https://maps.google.com/?q=Rua+Ana+Neri+501+Ourinhos+SP’;
const TEL_REC   = ‘(14) 3324-6489’;

// ============================================================
//  SESSOES POR CLIENTE
// ============================================================
const sessoes = {};

function getSessao(tel) {
if (!sessoes[tel]) {
sessoes[tel] = { etapa: ‘menu’, dados: {}, atendimento_humano: false };
}
return sessoes[tel];
}

// ============================================================
//  ENVIO DE MENSAGEM VIA Z-API
// ============================================================
function enviarMensagem(telefone, texto) {
const body = JSON.stringify({ phone: telefone, message: texto });
const opts = {
hostname: ‘api.z-api.io’,
path:     ‘/instances/’ + CONFIG.ZAPI_INSTANCE + ‘/token/’ + CONFIG.ZAPI_TOKEN + ‘/send-text’,
method:   ‘POST’,
headers: {
‘Content-Type’:   ‘application/json’,
‘Client-Token’:   CONFIG.ZAPI_CLIENT_TOKEN,
‘Content-Length’: Buffer.byteLength(body),
},
};
const req = https.request(opts, function(res) {
let d = ‘’;
res.on(‘data’, function(c) { d += c; });
res.on(‘end’, function() {
console.log(’[ENVIADO -> ’ + telefone + ‘] status ’ + res.statusCode);
});
});
req.on(‘error’, function(e) { console.error(’[ERRO envio]’, e.message); });
req.write(body);
req.end();
}

// ============================================================
//  ALERTAS INTERNOS AO DONO
// ============================================================
function alertarDono(tipo, telefoneCliente, mensagemCliente, dadosExtras) {
const hora = new Date().toLocaleString(‘pt-BR’, { timeZone: ‘America/Sao_Paulo’ });
const labels = {
reclamacao: ‘Reclamacao de cliente’,
esquecido:  ‘Item esquecido’,
decoracao:  ‘Reserva com decoracao especial’,
atendente:  ‘Cliente solicitou atendente’,
};

let alerta =
‘ALERTA LAMORE\n’ +
’Tipo: ’ + labels[tipo] + ‘\n’ +
’Cliente: ’ + telefoneCliente + ‘\n’ +
‘Mensagem: “’ + mensagemCliente + ‘”\n’ +
’Hora: ’ + hora;

if (dadosExtras) {
alerta += ‘\n\nDados da reserva:\n’ + dadosExtras;
}

enviarMensagem(CONFIG.NUMERO_DONO, alerta);
console.log(’[ALERTA DONO] ’ + labels[tipo] + ’ - cliente ’ + telefoneCliente);
}

// ============================================================
//  TEXTOS DAS SUITES
// ============================================================
const SUITE_STANDART =
‘\u{1F6CF} *Suite Standart*\n\n’ +
‘Conforto e aconchego para uma pausa especial.\n\n’ +
‘\u2705 TV\n’ +
‘\u2705 Ar-condicionado\n’ +
‘\u2705 Frigobar\n’ +
‘\u2705 Ducha higienica *(nao possui chuveiro)*\n’ +
‘\u{1F697} Estacionamento coberto e privativo\n\n’ +
‘\u{1F4B0} *2 horas:*\n’ +
‘\u{1F4C5} Semana *(seg 6h ate qui 18h)*: R$ 50,00 (hora adicional R$ 20,00)\n’ +
‘\u{1F4C5} Fim de semana *(qui 18h ate seg 6h)*: R$ 55,00 (hora adicional R$ 20,00)\n\n’ +
‘\u23F0 Entrada direta, 24 horas! Nao e necessario reserva.\n\n’ +
‘\u2728 *Dica: por apenas R$ 30,00 a mais, a Suite Luxo tem chuveiro e opcao de pernoite. Digite *3* para conhecer!*’;

const SUITE_LUXO =
‘\u2728 *Suite Luxo*\n\n’ +
‘Sofisticacao e bem-estar com exclusividade.\n\n’ +
‘\u2705 TV\n’ +
‘\u2705 Ar-condicionado\n’ +
‘\u2705 Frigobar\n’ +
‘\u2705 Chuveiro\n’ +
‘\u{1F697} Estacionamento coberto e privativo\n\n’ +
‘\u{1F4B0} *2 horas:*\n’ +
‘\u{1F4C5} Semana *(seg 6h ate qui 18h)*: R$ 80,00 (hora adicional R$ 35,00)\n’ +
‘\u{1F4C5} Fim de semana *(qui 18h ate seg 6h)*: R$ 85,00 (hora adicional R$ 35,00)\n\n’ +
‘\u{1F319} *Pernoite (12h):*\n’ +
‘\u{1F4C5} Semana: R$ 179,00\n’ +
‘\u{1F4C5} Fim de semana: R$ 269,00\n\n’ +
‘\u{1F339} Com decoracao especial: a partir de R$ 329,00\n\n’ +
‘\u23F0 Entrada direta, 24 horas! Nao e necessario reserva.\n’ +
‘*(Reserva obrigatoria apenas para decoracao especial)*\n\n’ +
‘\u2728 *Dica: a Suite Hidro tem hidromassagem privativa. Digite *4* para conhecer!*’;

const SUITE_HIDRO =
‘\u{1F6C1} *Suite Hidro*\n\n’ +
‘Hidromassagem privativa para momentos inesqueciveis.\n\n’ +
‘\u2705 Hidromassagem\n’ +
‘\u2705 Chuveiro\n’ +
‘\u2705 Ar-condicionado\n’ +
‘\u2705 TV\n’ +
‘\u2705 Frigobar\n’ +
‘\u{1F697} Estacionamento coberto e privativo\n\n’ +
‘\u{1F4B0} *2 horas:*\n’ +
‘\u{1F4C5} Semana *(seg 6h ate qui 18h)*: R$ 149,00 (hora adicional R$ 70,00)\n’ +
‘\u{1F4C5} Fim de semana *(qui 18h ate seg 6h)*: R$ 169,00 (hora adicional R$ 70,00)\n\n’ +
‘\u{1F319} *Pernoite (12h):*\n’ +
‘\u{1F4C5} Semana: R$ 299,00\n’ +
‘\u{1F4C5} Fim de semana: R$ 419,00\n\n’ +
‘\u{1F339} Com decoracao especial: a partir de R$ 529,00\n\n’ +
‘\u23F0 Entrada direta, 24 horas! Nao e necessario reserva.\n’ +
‘*(Reserva obrigatoria apenas para decoracao especial)*\n\n’ +
‘\u2728 *Dica: a Hidro Premium e nossa suite mais exclusiva. Digite *5* para conhecer!*’;

const SUITE_PREMIUM =
‘\u{1F451} *Hidro Premium*\n\n’ +
‘Nossa suite mais exclusiva. Maximo em bem-estar e privacidade.\n\n’ +
‘\u2705 Hidromassagem premium\n’ +
‘\u2705 Chuveiro\n’ +
‘\u2705 Ar-condicionado\n’ +
‘\u2705 TV\n’ +
‘\u2705 Frigobar\n’ +
‘\u{1F697} Estacionamento coberto e privativo\n\n’ +
‘\u{1F4B0} *2 horas:*\n’ +
‘\u{1F4C5} Semana *(seg 6h ate qui 18h)*: R$ 165,00 (hora adicional R$ 40,00)\n’ +
‘\u{1F4C5} Fim de semana *(qui 18h ate seg 6h)*: R$ 185,00 (hora adicional R$ 40,00)\n\n’ +
‘\u{1F319} *Pernoite (12h):*\n’ +
‘\u{1F4C5} Semana: R$ 329,00\n’ +
‘\u{1F4C5} Fim de semana: R$ 439,00\n\n’ +
‘\u{1F339} Com decoracao especial: a partir de R$ 549,00\n\n’ +
‘\u23F0 Entrada direta, 24 horas! Nao e necessario reserva.\n’ +
‘*(Reserva obrigatoria apenas para decoracao especial)*\n\n’ +
‘\u{1F3C6} A escolha perfeita para quem quer o melhor!’;

// ============================================================
//  MENSAGENS FIXAS
// ============================================================
const MENU_PRINCIPAL =
‘Ola! Seja muito bem-vindo ao *Motel Lamore* \u{1F339}\n\n’ +
‘Somos referencia em bem-estar e exclusividade em Ourinhos/SP.\n\n’ +
‘Como posso te ajudar? Digite o numero:\n\n’ +
‘1 - Ver suites e precos\n’ +
‘2 - Suite Standart\n’ +
‘3 - Suite Luxo\n’ +
‘4 - Suite Hidro\n’ +
‘5 - Hidro Premium\n’ +
‘6 - Ver fotos\n’ +
‘7 - Decoracao especial\n’ +
‘8 - Disponibilidade de quartos\n’ +
‘9 - Como chegar\n’ +
‘0 - Falar com atendente’;

const MENU_SUITES =
‘\u{1F339} *Nossas suites:*\n\n’ +
‘\u{1F6CF} *Standart* - a partir de R$ 50,00 (2h)\n’ +
‘\u2728 *Luxo* - a partir de R$ 80,00 (2h) | R$ 179,00 (pernoite)\n’ +
‘\u{1F6C1} *Hidro* - a partir de R$ 149,00 (2h) | R$ 299,00 (pernoite)\n’ +
‘\u{1F451} *Hidro Premium* - a partir de R$ 165,00 (2h) | R$ 329,00 (pernoite)\n\n’ +
‘\u23F0 *Nossos periodos:*\n’ +
‘\u{1F4C5} Semana: segunda as 6h ate quinta as 18h\n’ +
‘\u{1F4C5} Fim de semana: quinta as 18h ate segunda as 6h\n\n’ +
‘\u2139 Nao e necessario reserva para aproveitar nossas suites!\n’ +
‘A reserva e obrigatoria apenas para decoracao especial.\n\n’ +
‘Digite o numero da suite:\n’ +
‘2 - Standart | 3 - Luxo | 4 - Hidro | 5 - Premium’;

const HORARIOS_MSG =
‘\u23F0 *Horarios e valores do Motel Lamore*\n\n’ +
‘\u{1F4C5} *Periodo Semana:*\n’ +
‘Segunda-feira as 6h ate Quinta-feira as 18h\n\n’ +
‘\u{1F4C5} *Periodo Fim de Semana:*\n’ +
‘Quinta-feira as 18h ate Segunda-feira as 6h\n\n’ +
‘\u{1F4B0} *Valores:*\n\n’ +
‘\u{1F6CF} *Standart*\n’ +
’  2h: R$ 50,00 (semana) | R$ 55,00 (fim de semana)\n\n’ +
‘\u2728 *Luxo*\n’ +
’  2h: R$ 80,00 (semana) | R$ 85,00 (fim de semana)\n’ +
’  Pernoite: R$ 179,00 (semana) | R$ 269,00 (fim de semana)\n\n’ +
‘\u{1F6C1} *Hidro*\n’ +
’  2h: R$ 149,00 (semana) | R$ 169,00 (fim de semana)\n’ +
’  Pernoite: R$ 299,00 (semana) | R$ 419,00 (fim de semana)\n\n’ +
‘\u{1F451} *Hidro Premium*\n’ +
’  2h: R$ 165,00 (semana) | R$ 185,00 (fim de semana)\n’ +
’  Pernoite: R$ 329,00 (semana) | R$ 439,00 (fim de semana)\n\n’ +
‘Funcionamos *24 horas*, todos os dias!\n\n’ +
‘\u2139 Nao e necessario reserva. Pode vir direto!\n’ +
‘*(Reserva obrigatoria apenas para decoracao especial, com 36h de antecedencia)*’;

const RESERVAS_MSG =
‘\u2139 *Informacoes sobre reservas*\n\n’ +
‘Para aproveitar nossas suites *nao e necessario fazer reserva*!\n’ +
‘Basta chegar na recepcao a qualquer hora - funcionamos 24 horas.\n\n’ +
‘\u{1F4CC} *A reserva e obrigatoria apenas para:*\n’ +
‘Decoracao especial (minimo 36h de antecedencia)\n\n’ +
‘\u{1F4C5} *Periodos:*\n’ +
‘Semana: segunda as 6h ate quinta as 18h\n’ +
‘Fim de semana: quinta as 18h ate segunda as 6h\n\n’ +
‘Quer reservar uma decoracao especial? Digite *reservar*’;

const DIFERENCA_SUITES =
‘\u{1F4F8} *Comparativo das suites*\n\n’ +
‘\u{1F6CF} *Standart* - R$ 50,00 (2h semana)\n’ +
‘Ideal para uma pausa rapida. TV, ar, frigobar e ducha higienica.\n\n’ +
‘\u2728 *Luxo* - R$ 80,00 (2h semana)\n’ +
‘Mais conforto com chuveiro incluso. Opcao de pernoite.\n\n’ +
‘\u{1F6C1} *Hidro* - R$ 149,00 (2h semana)\n’ +
‘Hidromassagem privativa + chuveiro. Perfeita para relaxar a dois.\n\n’ +
‘\u{1F451} *Hidro Premium* - R$ 165,00 (2h semana)\n’ +
‘Nossa suite mais exclusiva com hidromassagem premium.\n\n’ +
‘\u{1F4F8} Para ver as fotos de cada suite:\n’ + FOTOS_URL;

const DECORACAO_MSG =
‘\u{1F339} *Decoracao Especial Lamore*\n\n’ +
‘Transformamos a suite num cenario unico e inesquecivel:\n\n’ +
‘\u{1F6CF} Cobertor vermelho\n’ +
‘\u{1F6CF} Lencol personalizado com frase a sua escolha:\n’ +
’   - Parabens pelo seu aniversario\n’ +
’   - Parabens pelo nosso aniversario de casamento\n’ +
’   - Felicidades aos noivos\n’ +
’   - Eu te amo\n’ +
’   - Quer casar comigo?\n’ +
’   - Quer namorar comigo?\n’ +
’   - Vamos brindar o amor\n’ +
’   - Voce me faz feliz\n\n’ +
‘\u{1F388} 2 baloes metalicos coracao + 15 bexigas\n’ +
‘\u{1F339} Petalas de rosas artificiais e naturais\n’ +
‘\u{1F56F} Velas decorativas LED + aparador\n’ +
‘\u{1F36B} 2 pacotes de bombons\n’ +
‘\u{1F6C1} Toalhas e tapetes personalizados\n’ +
‘\u{1F37E} Espumante no balde com gelo + 2 tacas\n\n’ +
‘\u{1F4CC} *Reserva com minimo 36h de antecedencia.*\n\n’ +
‘Para qual suite voce gostaria de reservar?\n’ +
‘3 - Luxo | 4 - Hidro | 5 - Premium\n\n’ +
‘Ou escreva *reservar* para iniciar o agendamento agora.’;

// ============================================================
//  VERIFICACAO DE PALAVRAS-CHAVE
// ============================================================
function contem(texto, palavras) {
const t = texto.toLowerCase();
for (let i = 0; i < palavras.length; i++) {
if (t.indexOf(palavras[i]) !== -1) return true;
}
return false;
}

const KW_RECLAMACAO  = [‘reclamacao’,‘reclamar’,‘problema’,‘pessimo’,‘horrivel’,‘insatisfeito’,‘decepcionado’,‘nao gostei’,‘sujo’,‘quebrado’,‘errado’,‘ruim’];
const KW_ESQUECIDO   = [‘esqueci’,‘esquecido’,‘esqueceu’,‘deixei’,‘objeto perdido’,‘bolsa’,‘carteira’,‘celular’,‘chave’,‘documento’,‘oculos’,‘roupa’,‘pertence’];
const KW_FOTO        = [‘foto’,‘fotos’,‘imagem’,‘imagens’,‘ver as fotos’,‘galeria’,‘quero ver as fotos’];
const KW_CHEGAR      = [‘endereco’,‘onde fica’,‘localizacao’,‘como chegar’,‘mapa’];
const KW_DISPONIVEL  = [‘disponivel’,‘disponibilidade’,‘tem quarto’,‘tem vaga’,‘livre’,‘vago’,‘ocupado’];
const KW_ATENDENTE   = [‘atendente’,‘humano’,‘falar com’,‘quero falar’,‘me ajuda’];
const KW_NUMERO_PRIV = [‘numero do dono’,‘seu numero’,‘numero interno’,‘43996’,‘99606’,‘numero privado’];
const KW_RESERVAR    = [‘quero reservar’,‘fazer reserva’,‘quero agendar’,‘reservar decoracao’];
const KW_HORARIO     = [‘horario’,‘preco’,‘valor’,‘valores’,‘periodo’,‘tabela’];
const KW_RESERVA_INFO = [‘preciso reservar’,‘precisa reservar’,‘tem que reservar’,‘e necessario reservar’,‘necessario reservar’,‘como reservar’,‘fazer reserva’,‘informacao sobre reserva’,‘preciso fazer reserva’];
const KW_DIFERENCA   = [‘diferenca’,‘diferenca entre’,‘qual a diferenca’,‘comparar’,‘comparativo’,‘melhor suite’,‘qual suite’,‘me explica as suites’,‘qual e melhor’];
const KW_OI          = [‘oi’,‘ola’,‘bom dia’,‘boa tarde’,‘boa noite’,‘hello’,‘hi’,‘hey’,‘menu’,‘inicio’,‘comeco’,‘ajuda’];

// ============================================================
//  FLUXO DE RESERVA COM DECORACAO
// ============================================================
function processarReserva(tel, texto, sessao) {
const etapa = sessao.etapa;

if (etapa === ‘reserva_suite’) {
sessao.dados.suite = texto;
sessao.etapa = ‘reserva_data’;
enviarMensagem(tel, ‘\u{1F4C5} Qual a *data e horario* desejados?\n_(Ex: 15/07/2025 as 20h)_’);
return;
}

if (etapa === ‘reserva_data’) {
sessao.dados.data = texto;
sessao.etapa = ‘reserva_espumante’;
enviarMensagem(tel, ‘\u{1F37E} Qual espumante voce prefere?\n\n1 - Chuva de Prata\n2 - Santa Colina’);
return;
}

if (etapa === ‘reserva_espumante’) {
if (texto === ‘1’) {
sessao.dados.espumante = ‘Chuva de Prata’;
} else if (texto === ‘2’) {
sessao.dados.espumante = ‘Santa Colina’;
} else {
sessao.dados.espumante = texto;
}
sessao.etapa = ‘reserva_frase’;
enviarMensagem(tel,
‘\u{1F4AC} Qual *frase* voce quer no lencol personalizado?\n\n’ +
‘Exemplos:\n’ +
‘- Eu te amo\n’ +
‘- Parabens pelo nosso aniversario\n’ +
‘- Quer casar comigo?\n\n’ +
‘Ou escreva a sua propria!’
);
return;
}

if (etapa === ‘reserva_frase’) {
sessao.dados.frase = texto;

```
const resumo =
  '\u{1F4CB} *Resumo da sua reserva:*\n\n' +
  'Suite: ' + sessao.dados.suite + '\n' +
  'Data/hora: ' + sessao.dados.data + '\n' +
  'Espumante: ' + sessao.dados.espumante + '\n' +
  'Frase: "' + sessao.dados.frase + '"\n\n' +
  '\u2705 Dados recebidos! Um atendente ira confirmar sua reserva em breve. \u{1F339}';

enviarMensagem(tel, resumo);

const dadosAlerta =
  'Suite: ' + sessao.dados.suite + '\n' +
  'Data/hora: ' + sessao.dados.data + '\n' +
  'Espumante: ' + sessao.dados.espumante + '\n' +
  'Frase: "' + sessao.dados.frase + '"';

alertarDono('decoracao', tel, 'Reserva com decoracao solicitada', dadosAlerta);

sessao.etapa = 'menu';
sessao.dados = {};
return;
```

}
}

// ============================================================
//  PROCESSADOR PRINCIPAL DE MENSAGENS
// ============================================================
function processarMensagem(tel, textoOriginal) {
const texto  = textoOriginal.trim();
const txtMin = texto.toLowerCase();
const sessao = getSessao(tel);

console.log(’[MSG] ’ + tel + ‘: “’ + texto + ’” | etapa: ’ + sessao.etapa + ’ | humano: ’ + sessao.atendimento_humano);

// 1. Pausado por atendimento humano
if (sessao.atendimento_humano) {
console.log(’[PAUSADO] ’ + tel + ’ em atendimento humano’);
return;
}

// 2. Protecao numero privado
if (contem(texto, KW_NUMERO_PRIV)) {
enviarMensagem(tel, ‘Nao tenho essa informacao disponivel. Posso te ajudar com nossas suites, precos ou agendamentos!’);
return;
}

// 3. Fluxo de reserva em andamento
if (sessao.etapa.indexOf(‘reserva_’) === 0) {
processarReserva(tel, texto, sessao);
return;
}

// 4. Reclamacao
if (contem(texto, KW_RECLAMACAO)) {
alertarDono(‘reclamacao’, tel, texto, null);
sessao.atendimento_humano = true;
enviarMensagem(tel,
‘Lamentamos muito que sua experiencia nao tenha sido a esperada. \u{1F614}\n\n’ +
‘Sua satisfacao e muito importante para nos. Estou chamando um atendente agora. Aguarde!’
);
return;
}

// 5. Item esquecido
if (contem(texto, KW_ESQUECIDO)) {
alertarDono(‘esquecido’, tel, texto, null);
sessao.atendimento_humano = true;
enviarMensagem(tel,
‘Vamos te ajudar a recuperar seu item o quanto antes! \u{1F60A}\n\n’ +
‘Estou chamando um atendente que ira verificar e providenciar a devolucao. Aguarde!’
);
return;
}

// 6. Atendente solicitado
if (contem(texto, KW_ATENDENTE) || txtMin === ‘0’) {
alertarDono(‘atendente’, tel, texto, null);
sessao.atendimento_humano = true;
enviarMensagem(tel, ‘Certo! Estou chamando um atendente. Em breve alguem ira te responder. \u{1F60A}’);
return;
}

// 7. Iniciar reserva com decoracao
if (contem(texto, KW_RESERVAR) || txtMin === ‘reservar’) {
sessao.etapa = ‘reserva_suite’;
enviarMensagem(tel,
‘\u{1F339} *Reserva com Decoracao Especial*\n\n’ +
‘Otimo! Para qual suite voce gostaria de reservar?\n’ +
‘- Luxo\n- Hidro\n- Hidro Premium’
);
return;
}

// 8. Informacoes sobre reserva
if (contem(texto, KW_RESERVA_INFO) || contem(texto, [‘reserva’,‘reservar’])) {
enviarMensagem(tel, RESERVAS_MSG);
sessao.etapa = ‘menu’;
return;
}

// 9. Diferenca entre suites
if (contem(texto, KW_DIFERENCA)) {
enviarMensagem(tel, DIFERENCA_SUITES);
sessao.etapa = ‘menu’;
return;
}

// 10. Fotos
if (contem(texto, KW_FOTO) || txtMin === ‘6’) {
enviarMensagem(tel,
‘\u{1F4F8} *Galeria de fotos do Motel Lamore*\n\n’ +
‘Confira todas as nossas suites em detalhes:\n’ + FOTOS_URL
);
sessao.etapa = ‘menu’;
return;
}

// 11. Como chegar
if (contem(texto, KW_CHEGAR) || txtMin === ‘9’) {
enviarMensagem(tel,
‘\u{1F4CD} *Motel Lamore*\n’ +
‘Rua Ana Neri, 501 - Ourinhos/SP\n\n’ +
‘\u{1F697} Estacionamento coberto e privativo, total discricao garantida.\n\n’ +
‘Abertos 24 horas! \u{1F60A}\n\n’ +
MAPS_URL
);
sessao.etapa = ‘menu’;
return;
}

// 12. Disponibilidade
if (contem(texto, KW_DISPONIVEL) || txtMin === ‘8’) {
enviarMensagem(tel,
‘Para verificar a disponibilidade entre em contato com nossa recepcao:\n\n’ +
‘\u{1F4DE} *’ + TEL_REC + ’*\n\nAtendemos 24 horas, todos os dias!’
);
sessao.etapa = ‘menu’;
return;
}

// 13. Decoracao especial
if (txtMin === ‘7’ || contem(texto, [‘decoracao’,‘decoracao especial’])) {
enviarMensagem(tel, DECORACAO_MSG);
sessao.etapa = ‘menu’;
return;
}

// 14. Horarios e precos
if (contem(texto, KW_HORARIO) || txtMin === ‘1’ && contem(texto, [‘preco’,‘valor’])) {
enviarMensagem(tel, HORARIOS_MSG);
sessao.etapa = ‘menu’;
return;
}

// 15. Menu de suites
if (txtMin === ‘1’ || contem(texto, [‘ver suites’,‘suites e precos’])) {
enviarMensagem(tel, MENU_SUITES);
sessao.etapa = ‘menu’;
return;
}

// 16. Suites individuais
if (txtMin === ‘2’ || contem(texto, [‘standart’,‘standard’,‘suite standart’])) {
enviarMensagem(tel, SUITE_STANDART);
sessao.etapa = ‘menu’;
return;
}
if (txtMin === ‘3’ || contem(texto, [‘suite luxo’,‘luxo’])) {
enviarMensagem(tel, SUITE_LUXO);
sessao.etapa = ‘menu’;
return;
}
if (txtMin === ‘4’ || contem(texto, [‘suite hidro’,‘hidromassagem’,‘hidro’])) {
enviarMensagem(tel, SUITE_HIDRO);
sessao.etapa = ‘menu’;
return;
}
if (txtMin === ‘5’ || contem(texto, [‘hidro premium’,‘suite premium’,‘premium’])) {
enviarMensagem(tel, SUITE_PREMIUM);
sessao.etapa = ‘menu’;
return;
}

// 17. Saudacao / menu inicial
if (contem(texto, KW_OI) || sessao.etapa === ‘menu’) {
enviarMensagem(tel, MENU_PRINCIPAL);
sessao.etapa = ‘aguardando’;
return;
}

// 18. Fallback
enviarMensagem(tel,
‘Nao entendi muito bem. \u{1F60A}\n\n’ +
‘Digite um numero do menu:\n\n’ +
‘1 - Ver suites | 2 a 5 - Suites\n’ +
‘6 - Fotos | 7 - Decoracao\n’ +
‘8 - Disponibilidade | 9 - Como chegar | 0 - Atendente’
);
}

// ============================================================
//  SERVIDOR HTTP
// ============================================================
const server = http.createServer(function(req, res) {
if (req.method !== ‘POST’ || req.url !== ‘/webhook’) {
res.writeHead(200);
res.end(‘Layla - Motel Lamore online’);
return;
}

let body = ‘’;
req.on(‘data’, function(chunk) { body += chunk; });
req.on(‘end’, function() {
try {
const payload  = JSON.parse(body);
let textoMsg   = ‘’;
const telMsg   = payload.phone || payload.from || payload.to || ‘’;

```
  if (payload.text && payload.text.message) {
    textoMsg = payload.text.message;
  } else if (payload.body) {
    textoMsg = payload.body;
  }

  // Mensagem enviada pelo atendente (fromMe)
  if (payload.fromMe) {
    const telCliente = payload.phone || payload.to || '';
    const txtEnv     = textoMsg.trim().toLowerCase();

    if (txtEnv === 'atendimento encerrado') {
      // Reativa a Layla para este cliente
      if (sessoes[telCliente]) {
        sessoes[telCliente].atendimento_humano = false;
        sessoes[telCliente].etapa = 'menu';
      }
      console.log('[REATIVADO] Layla reativada para ' + telCliente);
    } else if (telCliente && textoMsg) {
      // Atendente enviou mensagem — pausa a Layla automaticamente
      if (!sessoes[telCliente]) {
        sessoes[telCliente] = { etapa: 'menu', dados: {}, atendimento_humano: false };
      }
      if (!sessoes[telCliente].atendimento_humano) {
        sessoes[telCliente].atendimento_humano = true;
        console.log('[PAUSADO] Layla pausada automaticamente para ' + telCliente);
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
```

});
});

server.listen(CONFIG.PORTA, function() {
console.log(’’);
console.log(‘LAYLA v3.0 - Assistente Virtual Motel Lamore’);
console.log(‘Servidor rodando na porta ’ + CONFIG.PORTA);
console.log(’’);
});
