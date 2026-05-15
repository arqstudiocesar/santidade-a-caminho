import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Heart, Star, Search, Plus, X, Save, BookMarked, Scroll as ScrollIcon, Cross as CrossIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cacheGet, cacheSet, mergeServerData } from '../utils/cache';

type SubTab = 'daily' | 'adoration' | 'consecration' | 'ritos';
type PrayerCategory = 'habituais' | 'ladainhas' | 'formais';
interface PrayerItem { title: string; text: string; }
interface UserPrayerItem { id: number; title: string; text: string; category: PrayerCategory; }

// Helper para buscar token de autenticação salvo
function getAuthToken(): string {
  try {
    const s = localStorage.getItem('caminho_session');
    return s ? JSON.parse(s).token || '' : '';
  } catch { return ''; }
}

async function apiLoadUserPrayers(): Promise<UserPrayerItem[]> {
  try {
    const token = getAuthToken();
    if (!token) return [];
    const r = await fetch('/api/user-prayers', { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

async function apiSaveUserPrayer(title: string, text: string, category: PrayerCategory): Promise<number | null> {
  try {
    const token = getAuthToken();
    if (!token) return null;
    const r = await fetch('/api/user-prayers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, text, category }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data.id ?? null;
  } catch { return null; }
}

async function apiDeleteUserPrayer(id: number): Promise<void> {
  try {
    const token = getAuthToken();
    if (!token) return;
    await fetch(`/api/user-prayers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {}
}

// ── Orações Habituais ─────────────────────────────────────────────────────────
const habituais: PrayerItem[] = [
  { title: 'Pai Nosso', text: 'Pai nosso que estais no céu,\nsantificado seja o vosso nome,\nvenha a nós o vosso reino,\nseja feita a vossa vontade,\nassim na terra como no céu.\nO pão nosso de cada dia nos dai hoje,\nperdoai-nos as nossas ofensas,\nassim como nós perdoamos a quem nos tem ofendido,\ne não nos deixeis cair em tentação,\nmas livrai-nos do mal.\nAmém.' },
  { title: 'Ave Maria', text: 'Ave Maria, cheia de graça,\no Senhor é convosco,\nbendita sois vós entre as mulheres,\ne bendito é o fruto do vosso ventre, Jesus.\nSanta Maria, Mãe de Deus,\nrogai por nós pecadores,\nagora e na hora da nossa morte.\nAmém.' },
  { title: 'Salve Rainha', text: 'Salve, Rainha, Mãe de misericórdia,\nvida, doçura e esperança nossa, salve!\nA vós bradamos, os degredados filhos de Eva;\na vós suspiramos, gemendo e chorando\nneste vale de lágrimas.\nEia, pois, advogada nossa,\nessas vossas misericordiosas vistas a nós voltai;\ne depois deste desterro,\nmostrai-nos Jesus, bendito fruto do vosso ventre,\nó clemente, ó piedosa, ó doce sempre Virgem Maria.' },
  { title: 'Glória ao Pai', text: 'Glória ao Pai, ao Filho e ao Espírito Santo.\nAssim como era no princípio, agora e sempre,\ne por todos os séculos dos séculos.\nAmém.' },
  { title: 'Oração pelas Vocações', text: 'Senhor Jesus, que chamaste os Apóstolos a segui-vos, enviai operários para a vossa messe.\nDai à vossa Igreja sacerdotes santos, diáconos, religiosos, religiosas e leigos consagrados que, com generosidade e alegria, dediquem a vida ao serviço do Evangelho.\nAmém.' },
  { title: 'Consagração da Família ao Coração de Maria', text: 'Ó Virgem Imaculada,\nnós nos consagramos e nos entregamos inteiramente a vós,\nnossos corpos e nossas almas,\nnossas alegrias e nossas dores,\nnossas filhos e tudo o que somos e possuímos.\nConsagramos nossa família ao vosso Imaculado Coração,\npara que sejais a rainha, a mãe e o modelo de nossa vida.\nProtegei-nos, guiai-nos e intercedei por nós junto a vosso Filho Jesus.\nAmém.' },
  { title: 'Consagração da Família ao Sagrado Coração de Jesus', text: 'Ó adorável Coração de Jesus,\nnós nos consagramos e entregamos a vós nossa família inteira.\nSede o rei de nosso lar, reine em nossos corações,\nsantificai nossas alegrias e nossas dores.\nProtegei-nos de todo mal,\nconduzide-nos pelo caminho da virtude\ne tornai-nos dignos de vos contemplar na glória eterna.\nAmém.' },
  { title: 'Credo Apostólico', text: 'Creio em Deus Pai todo-poderoso,\nCriador do céu e da terra;\ne em Jesus Cristo, seu único Filho, nosso Senhor;\nque foi concebido pelo poder do Espírito Santo;\nnasceu da Virgem Maria;\npadeceu sob Pôncio Pilatos,\nfoi crucificado, morto e sepultado;\ndesceu à mansão dos mortos;\nressuscitou ao terceiro dia;\nsubiu aos céus,\nestá sentado à direita de Deus Pai todo-poderoso;\nd\'onde há de vir a julgar os vivos e os mortos.\nCreio no Espírito Santo;\nna santa Igreja Católica;\nna comunhão dos santos;\nna remissão dos pecados;\nna ressurreição da carne;\nna vida eterna.\nAmém.' },
  { title: 'Credo Niceno-Constantinopolitano', text: 'Creio em um só Deus, Pai todo-poderoso,\nCriador do céu e da terra,\nde todas as coisas visíveis e invisíveis.\nCreio em um só Senhor, Jesus Cristo,\nFilho Unigênito de Deus,\nnascido do Pai antes de todos os séculos:\nDeus de Deus, Luz da Luz,\nDeus verdadeiro de Deus verdadeiro;\ngerado, não criado, consubstancial ao Pai.\nPor ele todas as coisas foram feitas.\nE por nós, homens, e para nossa salvação\ndesceu dos céus: encarnando pelo Espírito Santo,\nnasceu da Virgem Maria e se fez homem.\nFoi crucificado por nós sob Pôncio Pilatos;\npadeceu e foi sepultado.\nRessuscitou ao terceiro dia, cumprindo as Escrituras;\nsubiu aos céus e está sentado à direita do Pai.\nDe novo há de vir em glória para julgar os vivos e os mortos;\ne o seu reino não terá fim.\nCreio no Espírito Santo, Senhor que dá a vida,\nque procede do Pai e do Filho;\ncom o Pai e o Filho é adorado e glorificado;\nfalou pelos profetas.\nCreio na Igreja una, santa, católica e apostólica.\nConfesso um só batismo para a remissão dos pecados.\nEspero a ressurreição dos mortos\ne a vida do mundo que há de vir.\nAmém.' },
  { title: 'Oração ao Santo Anjo da Guarda', text: 'Anjo de Deus, meu fiel guardião,\nque a tua santa custódia me foi dada\npela Piedade Divina,\nilumina-me, guarda-me,\nrege-me e governa-me.\nAmém.' },
  { title: 'Oração a São Miguel Arcanjo', text: 'São Miguel Arcanjo,\ndefendei-nos no combate;\nsede nosso refúgio contra a maldade\ne as ciladas do demônio.\nQue Deus o repreenda, humildemente o pedimos;\ne vós, príncipe da milícia celestial,\npela virtude divina,\nterrai no inferno Satanás\ne os outros espíritos malignos\nque vagam pelo mundo\npara perder as almas.\nAmém.' },
  { title: 'Memorare', text: 'Lembrai-vos, ó piíssima Virgem Maria,\nque jamais se ouviu dizer\nque algum daqueles que recorreram à vossa proteção,\nimplorou o vosso auxílio ou pediu o vosso socorro,\nfosse abandonado.\nAnimado por esta confiança,\ncorro a vós, ó Virgem das virgens e Mãe;\nvenho a vós, e, gemendo sob o peso dos meus pecados,\nprostro-me a vossos pés.\nÓ Mãe do Verbo Encarnado,\nnão desprezeis as minhas súplicas;\nmas ouvi-as e atendei-as propiciamente.\nAmém.' },
  { title: 'Sub Tuum Praesidium', text: 'Sob a vossa proteção nos acolhemos,\nSanta Mãe de Deus;\nnão desprezeis as nossas súplicas nas nossas necessidades,\nmas livrai-nos sempre de todos os perigos,\nó Virgem gloriosa e bendita.' },
  { title: 'Ato de Esperança', text: 'Senhor meu Deus,\nespero em Vós com toda firmeza\nque, pela vossa graça e os méritos de Jesus Cristo,\nme concedereis a vida eterna\ne os meios necessários para merecê-la.\nNesta esperança estou resolvido a viver e morrer.\nAmém.' },
  { title: 'Consagração a Nossa Senhora (Breve)', text: 'Ó Maria, Virgem poderosíssima\ne Mãe misericordiosa,\nrefúgio e auxílio dos pecadores:\nEu vos consagro minha alma, minha vida,\nminha morte e minha eternidade.\nProtegei-me durante toda a minha vida,\ne especialmente na hora da morte.\nAmém.' },
  { title: 'Veni Creator', text: 'Vinde, Espírito Criador,\nvisitai as almas dos vossos fiéis;\ncobri com a vossa graça\nos corações que criastes.\n\nVós que sois chamado Paráclito,\ndon de Deus altíssimo,\nágua viva, fogo, amor,\ne unção espiritual.\n\nVós que sois o dom setiforme,\ndedo da mão de Deus Pai,\nvós prometido pelo Pai,\nque inspiraes a nossa língua.\n\nIluminai os nossos sentidos,\ninfundi amor em nossos corações;\ncom força perpétua\nfortalecei nossa fraqueza.\n\nAfastai o inimigo longe\ne dai-nos logo a paz;\nassim, tendo vós por guia,\nevitemos todo o mal.\n\nDai-nos por vós conhecer o Pai\ne conhecer também o Filho;\ne a vós, Espírito de ambos,\ncreiamos em todo o tempo.\nAmém.' },
  { title: 'Angelus', text: 'V. O Anjo do Senhor anunciou a Maria.\nR. E ela concebeu pelo Espírito Santo.\n\nAve Maria...\n\nV. Eis a escrava do Senhor.\nR. Faça-se em mim segundo a vossa palavra.\n\nAve Maria...\n\nV. E o Verbo se fez carne.\nR. E habitou entre nós.\n\nAve Maria...\n\nV. Rogai por nós, Santa Mãe de Deus.\nR. Para que sejamos dignos das promessas de Cristo.\n\nOremos: Derramai, Senhor, a vossa graça em nossas almas, para que nós, que conhecemos, pelo anúncio do Anjo, a Encarnação de Cristo vosso Filho, cheguemos, pela sua Paixão e Cruz, à glória da Ressurreição. Por Cristo Nosso Senhor. Amém.' },
  { title: 'Magnificat', text: 'Minha alma glorifica ao Senhor,\ne o meu espírito se alegra em Deus, meu Salvador,\nporque olhou para a humildade de sua serva.\nDaí em diante todas as gerações me chamarão bem-aventurada,\nporque o Todo-Poderoso fez grandes coisas em meu favor.\nSanto é o seu nome,\ne sua misericórdia se estende de geração em geração\nsobre os que o temem.\nMostrou a força do seu braço,\ndispersou os que se orgulhavam de coração.\nDerrubou do trono os poderosos\ne exaltou os humildes.\nEncheu de bens os famintos\ne despediu os ricos de mãos vazias.\nAcolheu Israel, seu servo,\nlembrado de sua misericórdia,\ncomo prometeu a nossos pais,\nem favor de Abraão e de sua descendência para sempre.\nGlória ao Pai, ao Filho e ao Espírito Santo,\nAssim como era no princípio, agora e sempre,\ne por todos os séculos dos séculos. Amém.' },
  { title: 'Sub Tua Praesidium (Latim)', text: 'Sub tuum praesidium confugimus,\nSancta Dei Genitrix.\nNostras deprecationes ne despicias\nin necessitatibus nostris,\nsed a periculis cunctis\nlibera nos semper,\nVirgo gloriosa et benedicta.' },
  { title: 'Coroazinha de Nossa Senhora', text: 'Por cada Ave Maria, dizer a antífona:\n"Ó Maria, concebida sem pecado, rogai por nós que recorremos a Vós."\n\n3 Pai Nosso em honra da Santíssima Trindade\n12 Ave Maria (em grupos de 3) em honra dos 12 privilégios de Maria\n\nAo final:\nV. Ó Maria, concebida sem pecado.\nR. Rogai por nós que recorremos a Vós.\n\nOremos: Ó Deus, cujo Filho Unigênito, pela Sua vida, morte e ressurreição, nos obteve o prêmio da salvação eterna: concedei-nos, suplicamos, que meditando estes mistérios no Santíssimo Rosário da Bem-aventurada Virgem Maria, imitemos o que eles contêm e obtenhamos o que prometem. Por Cristo Nosso Senhor. Amém.' },
  { title: 'Oração de Santo Agostinho', text: 'Tarde vos amei, Formosura tão antiga e tão nova,\ntarde Vos amei!\nE eis que estáveis dentro de mim e eu lá fora,\ne assim procurava a Vós.\nInforme como era, lançava-me sobre as formosas coisas\nque criastes.\nEstáveis comigo e eu não estava convosco.\nLonge de Vós me retinham essas criaturas,\nque não existiriam se não existissem em Vós.\nChamastes e clamastes\ne rompestes a minha surdez.\nRelampejastes e brilhastes\ne fugiu a minha cegueira.\nEspalhastes o vosso perfume\ne respirei e por Vós anseio.\nGustei-Vos e tenho fome e sede de Vós.\nTocastes-me e inflamei-me no desejo da vossa paz.\nAmém.' },
  { title: 'Ave Estrela do Mar (Ave Maris Stella)', text: 'Ave, Estrela do Mar,\nMãe de Deus, Virgem Pura,\nPorta do Céu aberta,\nPorto de segura ventura.\n\nTu que recebeste a saudação de Gabriel,\nEstabelece-nos em paz,\nMudando o nome de Eva.\n\nSolta as cadeias dos cativos,\nDá luz aos cegos,\nAfugenta os males,\nPede todos os bens.\n\nMostra-te Mãe,\nReceba por ti as nossas preces,\nAquele que por nós nasceu,\nQuis ser teu Filho.\n\nVirgem incomparável,\nMansa entre todas,\nSolta-nos de pecados,\nFazei-nos mansos e puros.\n\nDá-nos vida casta,\nPrepara-nos o caminho seguro,\nPara que, vendo a Jesus,\nNos alegremos com Ele sempre.\n\nSeja honra a Deus Pai,\nAo Altíssimo Cristo,\nAo Espírito Santo,\nGlória a um só Deus. Amém.' },
  { title: 'Coroa de Nossa Senhora (15 Mistérios)', text: 'Início:\nV. Ó Deus, vinde em minha ajuda.\nR. Senhor, dai-me pressa em socorrer-me.\nGlória ao Pai...\n\nMistérios Gozosos (2ª e 6ª feira):\n1. A Anunciação — Ave Maria × 10\n2. A Visitação — Ave Maria × 10\n3. O Nascimento de Jesus — Ave Maria × 10\n4. A Apresentação no Templo — Ave Maria × 10\n5. Jesus encontrado no Templo — Ave Maria × 10\n\nMistérios Luminosos (5ª feira):\n1. O Batismo no Jordão — Ave Maria × 10\n2. As Bodas de Caná — Ave Maria × 10\n3. O Anúncio do Reino — Ave Maria × 10\n4. A Transfiguração — Ave Maria × 10\n5. A Instituição da Eucaristia — Ave Maria × 10\n\nMistérios Dolorosos (3ª e 6ª feira):\n1. A Agonia no Horto — Ave Maria × 10\n2. A Flagelação — Ave Maria × 10\n3. A Coroação de Espinhos — Ave Maria × 10\n4. Jesus carrega a Cruz — Ave Maria × 10\n5. A Crucificação — Ave Maria × 10\n\nMistérios Gloriosos (4ª feira e domingo):\n1. A Ressurreição — Ave Maria × 10\n2. A Ascensão — Ave Maria × 10\n3. Pentecostes — Ave Maria × 10\n4. A Assunção de Maria — Ave Maria × 10\n5. A Coroação de Maria — Ave Maria × 10\n\nAo final: Salve Rainha.' },
  { title: 'Oração de Renúncia a Satanás', text: 'Senhor Jesus Cristo, em Vosso Santo Nome e pelo poder da Vossa Cruz e Sangue Precioso, renuncio a Satanás, a todos os seus anjos, a todas as suas obras, a todas as suas vaidades, a todos os seus enganos e a todas as suas pompas.\n\nRenuncio a todas as influências ocultas, ao espiritismo, à magia, ao ocultismo, à New Age e a qualquer outra prática contrária à lei de Deus.\n\nConságro-me inteiramente a Vós, Senhor Jesus Cristo, e aceito-Vos como meu único Senhor e Redentor.\n\nSanta Maria, Mãe de Deus, São Miguel Arcanjo e todos os Santos, intercedei por nós. Amém.' },
  { title: 'Renúncia 1 — Ao espírito do mundo', text: 'Em nome de Jesus Cristo, Filho do Deus vivo,\ne pelo poder do Seu Sangue precioso,\nrenuncio ao espírito do mundo:\nà sua vaidade, ao seu orgulho,\nao amor desordenado das riquezas e dos prazeres,\nao espírito de competição e ambição,\nà indiferença religiosa e ao relativismo moral.\n\nReceio a Vós, Senhor Jesus, como meu único bem,\ne escolho viver segundo o Vosso Evangelho.\nAmém.' },
  { title: 'Renúncia 2 — Às influências hereditárias e maldições', text: 'Senhor Jesus Cristo,\nem Vosso Santo Nome renuncio a toda maldição,\na todo feitiço, a toda ligação espiritual maligna\nque possa ter entrado na minha família\npor gerações passadas,\npor pecados cometidos por meus antepassados,\npor práticas de ocultismo, maçonaria ou religiões pagãs.\n\nPelo poder do Vosso Sangue Precioso,\nquebro toda corrente e todo laço espiritual maligno\nherdado ou adquirido.\nDecreta-me livre em Vosso Nome.\nAmém.' },
  { title: 'Renúncia 3 — Oração de libertação pessoal', text: 'Pai Eterno, em nome de Jesus Cristo,\npelo poder do Seu Sangue Precioso\ne pela intercessão de Nossa Senhora,\npresenteio-me diante de Vós pedindo libertação\nde tudo que me aprisiona e separa de Vós.\n\nRenuncio a todo pecado, hábito ou vício\nque escraviza minha alma.\nRenuncio ao espírito de medo, de angústia,\nde depressão e de desesperança.\nRenuncio a toda amargura e falta de perdão.\n\nRecebo Vossa paz, Vossa liberdade e Vossa alegria.\nQue o Espírito Santo preencha todos os espaços vazios\nda minha alma com Vossa presença divina.\nAmém.' },
  { title: 'Adoro Te Devote', text: 'Adoro-te devotamente, Divindade oculta,\nque sob estas aparências te escondes verdadeiramente;\na ti se submete o meu coração totalmente,\nporque, contemplando-te, tudo desfalece.\n\nA vista, o tato e o gosto enganam-se em ti;\nmas o ouvido firme faz crer o que ouviu;\ncreio em tudo o que disse o Filho de Deus;\nnão há nada mais verdadeiro que esta Palavra de Verdade.\n\nNa Cruz estava oculta somente a Divindade;\naqui também está oculta a Humanidade;\nmas crendo e confessando ambas,\npeço o que pediu o ladrão arrependido.\n\nNão vejo as chagas como Tomé viu,\nmas confesso-te meu Deus;\nfazei-me crer cada vez mais em vós,\nneste vós esperar e vos amar.\n\nÓ Memória da morte do Senhor,\nPão vivo que dais vida ao homem:\nconcedei que a minha alma viva de vós\ne sempre saboreie de vós a doçura.\n\nAmém. (São Tomás de Aquino)' },
];

// ── Ladainhas ─────────────────────────────────────────────────────────────────
const ladainhas: PrayerItem[] = [
  { title: 'Ladainha de Nossa Senhora (Loreto)', text: 'Senhor, tende piedade. Cristo, tende piedade. Senhor, tende piedade.\n\nSanta Maria — rogai por nós.\nSanta Mãe de Deus — rogai por nós.\nSanta Virgem das virgens — rogai por nós.\nMãe de Cristo — rogai por nós.\nMãe da Igreja — rogai por nós.\nMãe da misericórdia — rogai por nós.\nMãe da graça divina — rogai por nós.\nMãe da esperança — rogai por nós.\nMãe puríssima — rogai por nós.\nMãe castíssima — rogai por nós.\nMãe imaculada — rogai por nós.\nMãe amável — rogai por nós.\nMãe admirável — rogai por nós.\nMãe do bom conselho — rogai por nós.\nMãe do Criador — rogai por nós.\nMãe do Salvador — rogai por nós.\nVirgem prudentíssima — rogai por nós.\nVirgem veneranda — rogai por nós.\nVirgem poderosa — rogai por nós.\nVirgem clemente — rogai por nós.\nVirgem fiel — rogai por nós.\nEspelho de justiça — rogai por nós.\nSede da Sabedoria — rogai por nós.\nCausa da nossa alegria — rogai por nós.\nRosa mística — rogai por nós.\nTorre de Davi — rogai por nós.\nPorta do céu — rogai por nós.\nEstrela da manhã — rogai por nós.\nSaúde dos enfermos — rogai por nós.\nRefúgio dos pecadores — rogai por nós.\nConsoladora dos aflitos — rogai por nós.\nAuxílio dos cristãos — rogai por nós.\nRainha dos anjos — rogai por nós.\nRainha dos santos — rogai por nós.\nRainha do Rosário — rogai por nós.\nRainha da família — rogai por nós.\nRainha da paz — rogai por nós.\n\nCordeiro de Deus — perdoai-nos, Senhor.\nCordeiro de Deus — ouvi-nos, Senhor.\nCordeiro de Deus — tende misericórdia de nós.\n\nRogai por nós, Santa Mãe de Deus.\nPara que sejamos dignos das promessas de Cristo. Amém.' },
  { title: 'Ladainha do Sagrado Coração de Jesus', text: 'Senhor, tende piedade. Cristo, tende piedade. Senhor, tende piedade.\n\nCoração de Jesus, Filho do Eterno Pai — tende misericórdia de nós.\nCoração de Jesus, formado pelo Espírito Santo no seio da Virgem Mãe — tende misericórdia de nós.\nCoração de Jesus, de infinita majestade — tende misericórdia de nós.\nCoração de Jesus, templo santo de Deus — tende misericórdia de nós.\nCoração de Jesus, ardendo em amor pelos homens — tende misericórdia de nós.\nCoração de Jesus, abismo de todas as virtudes — tende misericórdia de nós.\nCoração de Jesus, rei e centro de todos os corações — tende misericórdia de nós.\nCoração de Jesus, paciente e de grande misericórdia — tende misericórdia de nós.\nCoração de Jesus, fonte de vida e de santidade — tende misericórdia de nós.\nCoração de Jesus, propiciação pelos nossos pecados — tende misericórdia de nós.\nCoração de Jesus, esmagado pelas nossas iniquidades — tende misericórdia de nós.\nCoração de Jesus, obediente até a morte — tende misericórdia de nós.\nCoração de Jesus, trespassado por uma lança — tende misericórdia de nós.\nCoração de Jesus, nossa vida e ressurreição — tende misericórdia de nós.\nCoração de Jesus, nossa paz e reconciliação — tende misericórdia de nós.\nCoração de Jesus, salvação de todos que esperam em vós — tende misericórdia de nós.\nCoração de Jesus, esperança dos que morrem em vós — tende misericórdia de nós.\nCoração de Jesus, delícias de todos os santos — tende misericórdia de nós.\n\nCordeiro de Deus — perdoai-nos, Senhor.\nCordeiro de Deus — ouvi-nos, Senhor.\nCordeiro de Deus — tende misericórdia de nós.\n\nJesus, manso e humilde de coração.\nFazei o nosso coração semelhante ao vosso. Amém.' },
  { title: 'Ladainha dos Santos', text: 'Senhor, tende piedade. Cristo, tende piedade. Senhor, tende piedade.\n\nSanta Maria — rogai por nós.\nSão Miguel — rogai por nós.\nSão João Batista — rogai por nós.\nSão José — rogai por nós.\nSão Pedro e São Paulo — rogai por nós.\nSão João Evangelista — rogai por nós.\nSanta Maria Madalena — rogai por nós.\nSão Estêvão — rogai por nós.\nSão Lourenço — rogai por nós.\nSão Benedito — rogai por nós.\nSão Francisco de Assis — rogai por nós.\nSanta Catarina de Sena — rogai por nós.\nSanta Teresa de Ávila — rogai por nós.\nTodos os Santos e Santas de Deus — rogai por nós.\n\nSede-nos propício — perdoai-nos, Senhor.\nDe todo o mal — livrai-nos, Senhor.\nDo pecado e da morte eterna — livrai-nos, Senhor.\nPela vossa Cruz e Ressurreição — salvai-nos, Senhor.\nCristo, ouvi-nos. Cristo, atendei-nos. Amém.' },
  { title: 'Ladainha de São José', text: 'Senhor, tende piedade. Cristo, tende piedade. Senhor, tende piedade.\n\nSão José — rogai por nós.\nIlustrosa descendência de Davi — rogai por nós.\nEsposo da Mãe de Deus — rogai por nós.\nCasto guardião da Virgem — rogai por nós.\nPai nutrício do Filho de Deus — rogai por nós.\nSolícito defensor de Cristo — rogai por nós.\nChefe da Sagrada Família — rogai por nós.\nJosé justíssimo — rogai por nós.\nJosé castíssimo — rogai por nós.\nJosé fortíssimo — rogai por nós.\nJosé obedientíssimo — rogai por nós.\nJosé fidelíssimo — rogai por nós.\nEspelho de paciência — rogai por nós.\nAmante da pobreza — rogai por nós.\nModelo dos artífices — rogai por nós.\nGlória da vida doméstica — rogai por nós.\nGuardião das virgens — rogai por nós.\nConsolação dos aflitos — rogai por nós.\nEsperança dos enfermos — rogai por nós.\nPatrono dos moribundos — rogai por nós.\nTerror dos demônios — rogai por nós.\nProtetor da santa Igreja — rogai por nós.\n\nCordeiro de Deus — perdoai-nos, Senhor.\nCordeiro de Deus — ouvi-nos, Senhor.\nCordeiro de Deus — tende misericórdia de nós.\nRogai por nós, São José. Amém.' },
  { title: 'Ladainha do Santíssimo Nome de Jesus', text: 'Senhor, tende piedade. Cristo, tende piedade.\nJesus, ouvi-nos. Jesus, atendei-nos.\n\nJesus, Filho do Deus vivo — tende misericórdia de nós.\nJesus, esplendor do Pai — tende misericórdia de nós.\nJesus, rei da glória — tende misericórdia de nós.\nJesus, sol da justiça — tende misericórdia de nós.\nJesus, filho da Virgem Maria — tende misericórdia de nós.\nJesus, amabilíssimo — tende misericórdia de nós.\nJesus, Deus forte — tende misericórdia de nós.\nJesus, pai do século futuro — tende misericórdia de nós.\nJesus, poderosíssimo — tende misericórdia de nós.\nJesus, pacientíssimo — tende misericórdia de nós.\nJesus, obedientíssimo — tende misericórdia de nós.\nJesus, manso e humilde de coração — tende misericórdia de nós.\nJesus, amante da castidade — tende misericórdia de nós.\nJesus, Deus da paz — tende misericórdia de nós.\nJesus, autor da vida — tende misericórdia de nós.\nJesus, nosso refúgio — tende misericórdia de nós.\nJesus, pai dos pobres — tende misericórdia de nós.\nJesus, bom Pastor — tende misericórdia de nós.\nJesus, verdadeira luz — tende misericórdia de nós.\nJesus, eterna sabedoria — tende misericórdia de nós.\nJesus, bondade infinita — tende misericórdia de nós.\nJesus, caminho e vida — tende misericórdia de nós.\nJesus, alegria dos anjos — tende misericórdia de nós.\nJesus, coroa de todos os santos — tende misericórdia de nós.\n\nCordeiro de Deus — perdoai-nos, Jesus.\nCordeiro de Deus — ouvi-nos, Jesus.\nCordeiro de Deus — tende misericórdia de nós.\nJesus, ouvi-nos. Jesus, atendei-nos. Amém.' },
  { title: 'Ladainha da Divina Misericórdia', text: 'Misericórdia divina, fundamento da nossa esperança — confio em vós.\nMisericórdia divina, que excedeis todos os nossos pecados — confio em vós.\nMisericórdia divina, fonte que jorra da vida eterna — confio em vós.\nMisericórdia divina, consolação dos corações angustiados — confio em vós.\nMisericórdia divina, esperança única dos desesperados — confio em vós.\nMisericórdia divina, repouso dos corações — confio em vós.\nMisericórdia divina, beatitude dos humildes — confio em vós.\nMisericórdia divina, admiração dos anjos — confio em vós.\nMisericórdia divina, incompreensível para toda mente criada — confio em vós.\nMisericórdia divina, coroa de todos os santos — confio em vós.\n\nCordeiro de Deus — perdoai-nos, Senhor.\nCordeiro de Deus — ouvi-nos, Senhor.\nCordeiro de Deus — tende misericórdia de nós. Amém.' },
  { title: 'Ladainha de São Bento', text: 'Senhor, tende piedade. Cristo, tende piedade. Senhor, tende piedade.\n\nSão Bento, pai dos monges — rogai por nós.\nSão Bento, espelho de humildade — rogai por nós.\nSão Bento, coluna da Igreja — rogai por nós.\nSão Bento, luz dos monges — rogai por nós.\nSão Bento, modelo de penitência — rogai por nós.\nSão Bento, exemplo de obediência — rogai por nós.\nSão Bento, mestre espiritual — rogai por nós.\nSão Bento, protetor da Europa — rogai por nós.\nSão Bento, terror do demônio — rogai por nós.\nSão Bento, patrono dos moribundos — rogai por nós.\n\nCordeiro de Deus — perdoai-nos, Senhor.\nCordeiro de Deus — ouvi-nos, Senhor.\nCordeiro de Deus — tende misericórdia de nós.\nRogai por nós, São Bento. Amém.' },
  { title: 'Ladainha do Espírito Santo', text: 'Espírito Santo, que procedes do Pai e do Filho — vinde a nós.\nEspírito de sabedoria — iluminai-nos.\nEspírito de entendimento — esclarecei-nos.\nEspírito de conselho — guiai-nos.\nEspírito de fortaleza — fortalecei-nos.\nEspírito de ciência — instruí-nos.\nEspírito de piedade — santificai-nos.\nEspírito de temor de Deus — ensinai-nos.\nEspírito de amor — inflamai-nos.\nEspírito de graça — enriquecei-nos.\nEspírito de oração — animai-nos.\nEspírito de paz — tranquilizai-nos.\nEspírito de humildade — abençoai-nos.\nEspírito de pureza — santificai-nos.\nEspírito de verdade — guiai-nos.\n\nEnviai o vosso Espírito e tudo será criado.\nE renovareis a face da terra.\nOremos: Deus, que instruístes os corações dos vossos fiéis com a luz do Espírito Santo, concedei-nos que apreciemos sempre o reto e gozemos de sua consolação. Amém.' },
  { title: 'Ladainha de Nossa Senhora de Fátima', text: 'Senhora do Rosário de Fátima — rogai por nós.\nSenhora que veio do Céu — rogai por nós.\nSenhora da paz — rogai por nós.\nSenhora do coração imaculado — rogai por nós.\nSenhora que pede penitência — rogai por nós.\nSenhora que pede rezar o Rosário — rogai por nós.\nSenhora da esperança — rogai por nós.\nSenhora de Portugal — rogai por nós.\nSenhora dos pastorinhos — rogai por nós.\nSenhora que intercede pelos pecadores — rogai por nós.\nSenhora que acolhe os que sofrem — rogai por nós.\nSenhora que consola os aflitos — rogai por nós.\n\nCordeiro de Deus — perdoai-nos, Senhor.\nCordeiro de Deus — ouvi-nos, Senhor.\nCordeiro de Deus — tende misericórdia de nós.\nNossa Senhora de Fátima, rogai por nós. Amém.' },
  { title: 'Ladainha de Ação de Graças', text: 'Por termos sido criados à imagem e semelhança de Deus — graças vos damos, Senhor.\nPela redenção de Jesus Cristo — graças vos damos, Senhor.\nPelos sacramentos da Igreja — graças vos damos, Senhor.\nPelas graças recebidas na vida — graças vos damos, Senhor.\nPelas pessoas que nos amam — graças vos damos, Senhor.\nPelas dificuldades que nos purificam — graças vos damos, Senhor.\nPelo dom da fé — graças vos damos, Senhor.\nPela intercessão de Maria — graças vos damos, Senhor.\nPela comunhão dos santos — graças vos damos, Senhor.\nPela esperança do Paraíso — graças vos damos, Senhor.\n\nLouvai ao Senhor todas as nações.\nExaltai-o todos os povos.\nPois é poderoso o seu amor por nós.\nA fidelidade do Senhor é eterna. Aleluia! Amém.' },
];

// ── Orações Formais ───────────────────────────────────────────────────────────
const formais: PrayerItem[] = [
  { title: 'Oferecimento do Dia', text: 'Senhor meu Deus, eu Vos ofereço todas as minhas orações, trabalhos, alegrias e sofrimentos deste dia, em união com o Coração de Vosso Filho Jesus Cristo, que continua a oferecer-Se a Vós na Eucaristia, pela salvação do mundo, em reparação dos pecados e pela conversão dos pecadores.\nAmém.' },
  { title: 'Oração da Manhã', text: 'Senhor, neste novo dia que começa,\nofereço-vos tudo o que sou e tudo o que faço.\nIluminai minha mente, fortalecei minha vontade,\nsantificai meu coração.\nFazei que cada pensamento, palavra e ação\nde hoje seja um ato de amor e glória para vós.\nMaria, guia meus passos.\nAmém.' },
  { title: 'Oração da Noite', text: 'Senhor meu Deus,\nao encerrar mais este dia,\nvos agradeço por todos os benefícios recebidos.\nPerdoai-me pelas faltas e pecados cometidos.\nProtegei-me e a todos os meus durante a noite\ne concedei-me um sono reparador.\nNa vossa paz, repouso.\nAmém.' },
  { title: 'Oração de São Bento', text: 'Crux sacra sit mihi lux! (Cruz sagrada seja minha luz!)\nNon draco sit mihi dux! (Não seja o dragão meu guia!)\nVade retro Satana! (Vai, Satanás!)\nNunquam suade mihi vana! (Nunca me aconselhes vaidades!)\nSunt mala quae libas; (Mau é o que ofereces;)\nIpse venena bibas! (bebe tu mesmo o teu veneno!)\nAmém.' },
  { title: 'Oração de São Francisco (Paz)', text: 'Senhor, fazei-me instrumento de vossa paz.\nOnde houver ódio, que eu leve o amor;\nonde houver ofensa, que eu leve o perdão;\nonde houver discórdia, que eu leve a união;\nonde houver dúvida, que eu leve a fé;\nonde houver erro, que eu leve a verdade;\nonde houver desespero, que eu leve a esperança;\nonde houver tristeza, que eu leve a alegria;\nonde houver trevas, que eu leve a luz.\n\nÓ Mestre, fazei que eu procure mais:\nconsolar do que ser consolado;\ncompreender do que ser compreendido;\namar do que ser amado.\nPois é dando que se recebe,\nem perdoando que somos perdoados;\ne é morrendo que se nasce para a vida eterna.\nAmém.' },
  { title: 'Ato de Contrição', text: 'Meu Deus, eu me arrependo de todo o coração de todos os meus pecados, e os detesto, porque ao pecar eu mereço vossos castigos e, mais do que tudo, porque ofendi a vós, que sois sumamente bom e que mereceis todo o meu amor. Proponho com o auxílio de vossa graça, confessar meus pecados, fazer penitência e emendar minha vida.\nAmém.' },
  { title: 'Ângelus', text: 'V. O Anjo do Senhor anunciou a Maria.\nR. E ela concebeu pelo Espírito Santo.\nAve Maria...\n\nV. Eis a escrava do Senhor.\nR. Faça-se em mim segundo a vossa palavra.\nAve Maria...\n\nV. E o Verbo se fez carne.\nR. E habitou entre nós.\nAve Maria...\n\nV. Rogai por nós, Santa Mãe de Deus.\nR. Para que sejamos dignos das promessas de Cristo.\n\nOremos: Derramai, Senhor, a vossa graça em nossas almas, para que nós, que conhecemos a Encarnação de Cristo vosso Filho pelo anúncio do Anjo, cheguemos, pela sua Paixão e Cruz, à glória da Ressurreição. Amém.' },
  { title: 'Sinal da Cruz', text: 'Em nome do Pai,\ne do Filho,\ne do Espírito Santo.\nAmém.\n\n(Em latim)\nIn nómine Patris,\net Fílii,\net Spíritus Sancti.\nAmen.' },
  { title: 'Te Deum', text: 'A vós, ó Deus, louvamos;\na vós, Senhor, reconhecemos.\nA vós, Pai eterno,\ntoda a terra venera.\nOs anjos todos vos louvam,\nos céus e todos os poderes.\nOs querubins e serafins cantam sem cessar:\nSanto, Santo, Santo,\nSenhor Deus do universo.\nOs céus e a terra estão cheios\nda majestade da vossa glória.\n\nVós sois o rei da glória, Cristo.\nVós sois o Filho eterno do Pai.\nPara libertar o homem,\nnão recusastes o seio da Virgem.\nVencida a agudeza da morte,\nabristes aos crentes o reino dos céus.\nEstais sentado à direita de Deus, na glória do Pai.\nAcreditamos que deveis vir como juiz.\n\nSalvai o vosso povo, Senhor,\ne abençoai a vossa herança.\nGovernai-o e levantai-o para sempre.\nDia após dia vos bendizemos\ne louvamos o vosso nome pelos séculos dos séculos.\n\nDignai-vos, Senhor, neste dia, guardar-nos sem pecado.\nTende misericórdia de nós, Senhor, tende misericórdia de nós.\nFaça-se sobre nós a vossa misericórdia, Senhor,\nassim como esperamos em vós.\nEm vós esperei, Senhor;\nnão fique eu confundido para sempre. Amém.' },
  { title: 'Alma de Cristo (Anima Christi)', text: 'Alma de Cristo, santificai-me.\nCorpo de Cristo, salvai-me.\nSangue de Cristo, embriagai-me.\nÁgua do lado de Cristo, lavai-me.\nPaixão de Cristo, fortalecei-me.\nÓ bom Jesus, ouvi-me.\nDentro das vossas chagas escondei-me.\nNão permitais que me afaste de vós.\nDo maligno inimigo defendei-me.\nNa hora da minha morte chamai-me\ne mandai-me ir a vós,\npara que com os vossos santos vos louve\npelos séculos dos séculos.\nAmém.' },
  { title: 'Ato de Amor', text: 'Meu Deus, eu vos amo acima de todas as coisas, com todo o meu coração e com toda a minha alma, porque sois infinitamente bom e mereceis todo o amor. Amo o meu próximo como a mim mesmo pelo amor de vós. Perdoo a todos os que me ofenderam, e peço perdão a todos os que ofendi.\nAmém.' },
  { title: 'Ato de Abandono à Misericórdia', text: 'Ó Jesus misericordioso,\nabandonome a vós.\nFazei de mim o que quiserdes.\nQualquer que seja o meu destino,\naceitoque ele venha de vossas mãos.\nNão quero conhecer outra coisa senão vossa vontade.\nEnsinai-me a orar. Orai vós mesmo em mim.\nAmém.' },
  { title: 'Ato de Oferta', text: 'Senhor meu Deus,\nofereço-vos tudo o que tenho e tudo o que sou:\nminhas faculdades, minha memória,\nmeu entendimento, minha vontade.\nOfereço-vos meu corpo, minha alma e minha vida.\nFazei de mim o que quiserdes para vossa maior glória.\nAmém.' },
  { title: 'Ato de Fé', text: 'Meu Deus, creio firmemente em todas as verdades que a santa Igreja Católica me propõe a crer, porque vós as revelastes, ó Deus, que sois a suma Verdade, que nem pode enganar-se nem enganar-nos.\nAmém.' },
  { title: 'Ato de Caridade', text: 'Senhor meu Deus, amo-vos com todo o meu coração e sobre todas as coisas, porque sois o Sumo Bem e mereceis ser amado. E por vosso amor amo também o próximo como a mim mesmo e perdoo a todos os que me ofenderam.\nAmém.' },
  { title: 'Oração de Descontaminação', text: 'Senhor Jesus Cristo,\nficai em mim e ao meu redor como um escudo de luz.\nEspírito Santo, penetrai em todo o meu ser,\npurificai meu coração, minha mente, minha alma e meu corpo.\nRemovei de mim tudo aquilo que não vem de Deus.\nCobre-me, Senhor, com o vosso sangue precioso.\nQue a vossa presença seja minha proteção\nagora e sempre. Amém.' },
  { title: 'Oração de Descontaminação Espiritual', text: 'Eu (nome), Em nome de Jesus Cristo, ordeno que saia de mim, de minha casa, de minha família e de meus familiares, todas as forças espirituais do mal que possam ter nos contaminado, e ordeno que vão se prostar aos pés da Cruz de Jesus Cristo e no sangue de Jesus Cristo os proíbo de voltar a nós.\n\nEu (nome), Em nome de Jesus Cristo, ordeno que seja cancelado e aniquilado de mim, de minha casa e de toda a minha família, toda fúria satânica, toda seta maligna, toda opressão diabólica e todo dardo inflamado de Satanás e seus demônios, e ordeno que vão se prostar aos pés da Cruz de Jesus Cristo e no sangue de Jesus Cristo os proíbo de voltar a nós.\n\nEu (nome), Em nome de Jesus Cristo, ordeno que saia de mim, da minha casa, da minha família, de todos os nossos bens espirituais e temporais, de tudo o que está ligado a nós, de forma direta e indireta e até de nossos animais, todo espírito maligno, todo espírito devorador, todo espírito sanguinário, todo espírito de morte, e ordeno que vão se prostar aos pés da Cruz de Jesus Cristo, e no sangue de Jesus Cristo os proíbo de voltar a nós.\n\nAgora Jesus, eu me lavo inteiramente no Teu Sangue precioso, juntamente com toda a minha família. Que o Teu Sangue, Senhor Jesus, seja para nós cobertura e proteção. Revista-nos com a armadura do Espírito Santo.\n\nEu (nome), Declaro que Jesus Cristo é o nosso Senhor e Redentor. No Senhorio e no Poderio de Jesus Cristo consagro e submeto a mim e a toda a minha família.\n\nDivino Espírito Santo renova em cada um de nós a Tua Unção, a Tua Força e o Teu Poder.\n\nVirgem Maria, São Miguel Arcanjo e Anjos do Senhor rogai por nós. Amém.\nRezar a oração ao Espírito Santo e 1 Ave-Maria.' },
  { title: 'Oração de Renúncia', text: 'Senhor Jesus Cristo,\nem vosso Santo Nome e pelo poder da vossa Cruz,\nrenuncio a toda influência do mal,\na toda obra das trevas,\na todo pecado passado e presente.\nRenuncio ao demônio e a todas as suas obras.\nConságro-me a vós completamente.\nSejais meu Senhor e meu Deus agora e sempre.\nAmém.' },
];

// ── Ordenação alfabética dos grupos ──────────────────────────────────────────
habituais.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
ladainhas.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
formais.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

// ── Adoração Eucarística ──────────────────────────────────────────────────────
interface AdorationStep { phase: string; content: string; }
interface AdorationModel { title: string; subtitle: string; color: string; steps: AdorationStep[]; }

const adoracaoModels: AdorationModel[] = [
  {
    title: 'Modelo 1 — Santo Afonso Maria de Ligório',
    subtitle: 'Visitas ao Santíssimo Sacramento e a Nossa Senhora',
    color: 'amber',
    steps: [
      { phase: 'Preparação', content: 'Antes de entrar, recolha-se por alguns momentos na entrada da Igreja. Diga interiormente:\n\n"Ó meu Senhor Jesus Cristo, que por amor a mim vos fazeis prisioneiro neste sacrário, eu vos visito. E ainda que o fizesse mil vezes ao dia, seria ainda pouco em comparação do que vossa bondade merece."' },
      { phase: 'Ato de Fé e Adoração', content: 'Genuflexão profunda. Permaneça em silêncio por alguns minutos:\n\n"Acredito, Senhor, que estais presente nesta hóstia consagrada. Creio que sois verdadeiro Deus e verdadeiro homem. Com anjos e santos, prostro-me diante de vossa Majestade e vos adoro de todo meu coração."\n\n(Pausa de silêncio adorador: 3-5 minutos)' },
      { phase: 'Ato de Amor', content: '"Meu amado Jesus, vejo-vos revestido de humildade no altar, e me envergonho de vos contemplar cheio de vaidade e amor próprio. Vos amo, ó Bem infinito, com todo o meu coração. Ah, quisera poder amardes como vos amam os serafins e toda a Igreja celestial!"\n\n(Pausa de oração espontânea: 5 minutos)' },
      { phase: 'Ato de Contrição', content: '"Ó Jesus, minha tristeza é grande por vos ter ofendido! Não me pesa tanto pelas penas que mereci, quanto porque vos desgostei, que sois o Sumo Bem e me amastes tanto. Dai-me, Senhor, um coração arrependido."' },
      { phase: 'Petição', content: 'Apresente suas necessidades a Jesus:\n\n"Senhor, sabeis tudo. Sabeis de que tenho necessidade. Eu nada sou, nada posso, nada tenho; mas vós o podeis tudo. Suplicai-vos por [intenções pessoais]..."\n\n(Pausa para oração pessoal silenciosa: 5-10 minutos)' },
      { phase: 'Visita a Nossa Senhora', content: '"Ó Maria, Mãe de Deus e minha Mãe, intercedei por mim diante de vosso Filho. Vós que tendes tanto poder com ele, pedide-lhe tudo o que me é necessário para a salvação e santificação.\n\nGuardai-me sob o vosso manto. Sois minha esperança depois de Deus. Amém."' },
      { phase: 'Ato de Consagração Final', content: '"Senhor Jesus, ao término desta visita, renovo a consagração da minha vida a vós. Levai comigo a graça desta visita para que, ao longo do dia, eu possa viver em comunhão com vosso Coração. Obrigado por me terdes esperado. Voltarei. Amém."' },
    ],
  },
  {
    title: 'Modelo 2 — Forma Oficial da Igreja Católica',
    subtitle: 'Rito de Exposição, Adoração e Reposição do Santíssimo',
    color: 'olive',
    steps: [
      { phase: 'Exposição', content: 'O sacerdote ou ministro extraordinário expõe o Santíssimo Sacramento. Ao expor:\n\n"Louvado seja o Santíssimo Sacramento do Altar, agora e sempre."\nR. "Agora e sempre. Para sempre. Amém."\n\nHino de abertura: "Pange Lingua" (São Tomás de Aquino) ou hino eucarístico local.' },
      { phase: 'Silêncio Sagrado', content: 'Após a exposição: período de silêncio adorador (5-10 minutos).\n\nO Ritual Romano indica: "A adoração deve ser de silêncio profundo, no qual o fiel coloca sua vida na presença do Senhor."\n\nOpções:\n• Leitura da Sagrada Escritura (Jo 6,35-58 — Discurso do Pão da Vida)\n• Contemplação silenciosa\n• Oração pessoal interior' },
      { phase: 'Liturgia da Palavra', content: 'Leitura bíblica proclamada. Sugestões:\n\n• Jo 6,51-58: "Eu sou o pão vivo"\n• Mt 26,26-28: Instituição da Eucaristia\n• 1Cor 11,23-26: Tradição eucarística paulina\n• Sl 23 (22): "O Senhor é meu pastor"\n\nApós a leitura: breve reflexão opcional.\nSilêncio de interiorização (3 minutos).' },
      { phase: 'Hinos e Cânticos', content: 'Cânticos eucarísticos recomendados:\n\n• "O Salutaris Hostia"\n• "Tantum Ergo" (indispensável antes da Bênção)\n• "Adoro Te Devote"\n• Cânticos locais de adoração' },
      { phase: 'Ladainha e Preces', content: 'Pode-se rezar:\n• Ladainha do Santíssimo Nome de Jesus\n• Preces litúrgicas (Vésperas ou Completas)\n• Rosário meditado\n• Prece espontânea de intercessão pela Igreja, pelo mundo, pelos enfermos e pelos que sofrem.' },
      { phase: 'Tantum Ergo e Bênção', content: '"Tantum ergo Sacramentum / Veneremur cernui:\nEt antiquum documentum / Novo cedat ritui;\nPraestet fides supplementum / Sensuum defectui.\n\nGenitori Genitoque / Laus et jubilatio,\nSalus, honor, virtus quoque / Sit et benedictio:\nProcedenti ab utroque / Compar sit laudatio. Amen."\n\nV. Panem de coelo praestitisti eis.\nR. Omne delectamentum in se habentem.\n\nO sacerdote genuflexiona e dá a bênção com o ostensório. Todos se inclinam ou ajoelham.' },
      { phase: 'Reposição e Ação de Graças', content: 'Louvor Final:\n\n"Abençoado seja Deus!\nAbençoado seja o seu Santo Nome!\nAbençoado seja Jesus Cristo, verdadeiro Deus e verdadeiro Homem!\nAbençoado seja o Nome de Jesus!\nAbençoado seja o Seu Santíssimo Coração!\nAbençoado seja Jesus no Santíssimo Sacramento do Altar!\nAbençoada seja a Grande Mãe de Deus, Maria Santíssima!"\n\nEncerramento com ação de graças silenciosa.' },
    ],
  },
  {
    title: 'Modelo 3 — Santo Antônio Maria Claret',
    subtitle: 'Meditação Eucarística Claretiana',
    color: 'purple',
    steps: [
      { phase: 'Entrada em Presença', content: 'Santo Antônio Maria Claret ensinava: "Vá à Igreja como quem vai visitar um amigo que o espera. Jesus está ali, vivo, presente, esperando por você."\n\nEntre, genuflexione lentamente. Diga interiormente:\n\n"Jesus, vim. Sei que estais aqui. Não estou diante de um símbolo, mas diante de vossa realidade viva. Ajudai-me a estar aqui com todo o meu ser."' },
      { phase: 'Leitura Meditativa', content: 'Escolha um texto dos Evangelhos. Sugestões de Claret:\n• Jo 15,1-17 — Permanecei em mim\n• Lc 24,13-35 — Os discípulos de Emaús\n• Jo 20,24-29 — Tomé diante de Jesus\n\nLeia devagar. Releia. Permita que uma frase fique em vós.\n\n(10 minutos de leitura meditativa lenta)' },
      { phase: 'Colóquio com Jesus', content: 'Claret ensinava que o núcleo da adoração é o colóquio — a conversa pessoal e filial com Jesus:\n\n"Fale a Jesus como um filho fala a seu pai. Não precisa de palavras elaboradas. Diga o que está no coração. Se não souber o que dizer, diga apenas: \'Aqui estou, Senhor. Estou convosco.\' Isso já é oração perfeita."\n\n(15-20 minutos de oração pessoal espontânea e silenciosa)' },
      { phase: 'Ato de Confiança', content: '"Senhor Jesus, confio em vós. Não em minhas forças, não em meu mérito — confio em vós.\n\nConfio no poder de vossa Presença Eucarística que transforma os que se aproximam com fé.\n\nTransformai-me. Moldai meu coração segundo o vosso. Que ao sair daqui eu carregue algum reflexo da vossa luz para o mundo que espera por vós."\n\n(Pausa de silêncio: 5 minutos)' },
      { phase: 'Intercessão Apostólica', content: 'Claret dizia: "O adorador eucarístico não está sozinho — carrega o mundo em sua oração."\n\nPeça por:\n• A Igreja Universal e o Santo Padre\n• Sacerdotes e consagrados\n• Os que mais sofrem no mundo hoje\n• Os pecadores afastados de Deus\n• Os moribundos deste momento\n• Sua família e comunidade\n• As almas do purgatório\n\n(Oração de intercessão: 5-10 minutos)' },
      { phase: 'Hino de Louvor', content: '"Glória a vós, Jesus, presente neste altar!\nGlória a vós, Pão de Vida e Pão dos Anjos!\nGlória a vós, que sois o mesmo de ontem, de hoje e para sempre!\nObrigado por me terdes chamado. Obrigado por me terdes esperado. Obrigado por me terdes alimentado com vossa presença.\n\nLevo-vos comigo. Permanecei em mim. Amém."' },
      { phase: 'Propósito Prático', content: 'Antes de sair, Claret pedia um propósito concreto:\n\n"Que coisa específica farei hoje como fruto desta hora de adoração?"\n\nEscreva ou resolva interiormente uma resposta concreta: uma virtude a exercitar, um perdão a dar, uma ação a realizar.\n\nSaia em silêncio, carregando a presença de Cristo para o seu dia.' },
    ],
  },
];

// ── Dados Consagração ─────────────────────────────────────────────────────────
interface ConsecDay { day: number; subtheme: string; tratado: string; leitura: string; oracoes: string; exercicio: string; }
interface ConsecWeek { week: string; theme: string; color: string; days: ConsecDay[]; }

const consecrationSchedule: ConsecWeek[] = [

/* =========================
   SEMANA PREPARATÓRIA
   ========================= */

{
  week: 'Semana Preparatória (Dias 1–7)',
  theme: 'Desapego do Mundo — Purificação Interior',
  color: 'gray',
  days: [
    { day:1, subtheme:'Fim último do homem', tratado:'§1–6', leitura:'Mt 6,19-21', oracoes:'Veni Creator, Ave-Maria', exercicio:'Refletir profundamente: "Para que fui criado?"' },
    { day:2, subtheme:'Vaidade do mundo', tratado:'§7–12', leitura:'Ecl 1,2', oracoes:'Ave-Maria, Salmo 1', exercicio:'Identificar vaidades concretas na própria vida' },
    { day:3, subtheme:'Corrupção do homem', tratado:'§13–20', leitura:'Rm 3,10-18', oracoes:'Ato de Contrição, Salmo 51 (Miserere)', exercicio:'Exame de consciência profundo' },
    { day:4, subtheme:'Necessidade da graça', tratado:'§21–27', leitura:'Jo 15,5', oracoes:'Veni Creator, Ladainha do Espírito Santo', exercicio:'Reconhecer dependência total de Deus' },
    { day:5, subtheme:'Combate espiritual', tratado:'§28–36', leitura:'Ef 6,10-17', oracoes:'Oração a São Miguel, Rosário (Dolorosos)', exercicio:'Renunciar tentações concretas' },
    { day:6, subtheme:'Orgulho e amor próprio', tratado:'§37–41', leitura:'Lc 18,9-14', oracoes:'Ato de Humildade, Ave-Maria', exercicio:'Identificar formas de orgulho pessoal' },
    { day:7, subtheme:'Decisão de conversão', tratado:'§42–56', leitura:'Mc 8,34', oracoes:'Rosário (Dolorosos), Ato de Contrição', exercicio:'Escrever propósito concreto de mudança' },
  ]
},

/* =========================
   1ª SEMANA
   ========================= */

{
  week: '1ª Semana (Dias 8–14)',
  theme: 'Conhecimento de Si Mesmo — Humildade',
  color: 'blue',
  days: [
    { day:8,  subtheme:'Miséria humana',         tratado:'§57–66',   leitura:'Sl 51',        oracoes:'Miserere, Rosário',                   exercicio:'Meditar pecados passados com arrependimento' },
    { day:9,  subtheme:'Inclinação ao pecado',    tratado:'§67–75',   leitura:'Gn 8,21',      oracoes:'Ato de Contrição, Ave-Maria',          exercicio:'Identificar vícios dominantes' },
    { day:10, subtheme:'Orgulho espiritual',       tratado:'§76–85',   leitura:'Mt 23,12',     oracoes:'Ladainha dos Santos, Rosário',         exercicio:'Fazer um ato oculto de humildade' },
    { day:11, subtheme:'Falsas seguranças',         tratado:'§86–96',   leitura:'Lc 12,16-21', oracoes:'Salmo 127, Ave-Maria',                 exercicio:'Desapegar-se de algo material' },
    { day:12, subtheme:'Necessidade de direção',    tratado:'§97–110',  leitura:'Pv 3,5',       oracoes:'Veni Creator, Rosário',               exercicio:'Buscar orientação espiritual' },
    { day:13, subtheme:'Dependência de Deus',       tratado:'§111–120', leitura:'Jo 15,5',      oracoes:'Rosário, Ato de Confiança',            exercicio:'Entregar decisões importantes a Deus' },
    { day:14, subtheme:'Síntese da humildade',      tratado:'§121–130', leitura:'Fl 2,5-8',     oracoes:'Te Deum, Rosário completo',            exercicio:'Escrever quem você é diante de Deus' },
  ]
},

/* =========================
   2ª SEMANA
   ========================= */

{
  week: '2ª Semana (Dias 15–21)',
  theme: 'Conhecimento de Maria — Devoção Verdadeira',
  color: 'rose',
  days: [
    { day:15, subtheme:'Maria no plano de Deus', tratado:'§131–140', leitura:'Gn 3,15',   oracoes:'Ave-Maria, Ladainha de Nossa Senhora',    exercicio:'Meditar o papel de Maria na salvação' },
    { day:16, subtheme:'Grandeza de Maria',        tratado:'§141–150', leitura:'Lc 1,28',   oracoes:'Magnificat, Rosário',                    exercicio:'Contemplar virtudes de Maria' },
    { day:17, subtheme:'Necessidade de Maria',     tratado:'§151–160', leitura:'Jo 2,5',    oracoes:'Salve Rainha, Memorare',                 exercicio:'Pedir ajuda concreta a Maria' },
    { day:18, subtheme:'Falsas devoções',           tratado:'§161–170', leitura:'Mt 15,8',   oracoes:'Rosário, Ato de Contrição',              exercicio:'Examinar sua devoção mariana' },
    { day:19, subtheme:'Verdadeira devoção',        tratado:'§171–182', leitura:'Jo 19,27',  oracoes:'Consagração breve a Maria, Rosário',     exercicio:'Praticar entrega interior a Maria' },
    { day:20, subtheme:'Efeitos da devoção',        tratado:'§183–200', leitura:'Gl 2,20',   oracoes:'Rosário, Ave-Maria',                     exercicio:'Renunciar algo por amor a Maria' },
    { day:21, subtheme:'Entrega total a Maria',     tratado:'§201–220', leitura:'Lc 1,38',   oracoes:'Totus Tuus, Rosário completo',           exercicio:'Preparar a entrega total' },
  ]
},

/* =========================
   3ª SEMANA
   ========================= */

{
  week: '3ª Semana (Dias 22–28)',
  theme: 'Conhecimento de Jesus Cristo',
  color: 'green',
  days: [
    { day:22, subtheme:'Cristo Encarnado',          tratado:'§221–230', leitura:'Jo 1,14',   oracoes:'Credo, Rosário (Gozosos)',               exercicio:'Meditar a Encarnação' },
    { day:23, subtheme:'Cristo Salvador',            tratado:'§231–240', leitura:'Is 53',     oracoes:'Rosário (Dolorosos), Alma de Cristo',    exercicio:'Meditar a Paixão' },
    { day:24, subtheme:'Cristo vida interior',       tratado:'§241–248', leitura:'Gl 2,20',   oracoes:'Alma de Cristo, Rosário',                exercicio:'Oferecer ações a Cristo' },
    { day:25, subtheme:'Cruz e seguimento',          tratado:'§249–255', leitura:'Lc 9,23',   oracoes:'Via-Sacra, Rosário (Dolorosos)',          exercicio:'Aceitar uma cruz do dia' },
    { day:26, subtheme:'Vida em Cristo',             tratado:'§256–260', leitura:'Cl 3,3',    oracoes:'Rosário, Ato de Amor',                   exercicio:'Viver na presença de Deus' },
    { day:27, subtheme:'Reinado de Cristo',          tratado:'§261–265', leitura:'Fl 2,9-11', oracoes:'Te Deum, Rosário (Gloriosos)',            exercicio:'Oferecer o dia a Cristo Rei' },
    { day:28, subtheme:'União com Cristo por Maria', tratado:'§266–273', leitura:'Jo 15,4',   oracoes:'Consagração breve, Rosário completo',     exercicio:'Entrega interior total' },
  ]
},

/* =========================
   SEMANA FINAL
   ========================= */

{
  week: 'Semana Final (Dias 29–33)',
  theme: 'Preparação para a Consagração',
  color: 'gold',
  days: [
    { day:29, subtheme:'Recapitulação espiritual', tratado:'Revisão geral (§1–273)', leitura:'Cl 3,1-4',  oracoes:'Rosário completo, Ladainha de Nossa Senhora', exercicio:'Rever todo o caminho' },
    { day:30, subtheme:'Desapego final',            tratado:'Síntese espiritual',      leitura:'Mt 19,21',  oracoes:'Ladainha de Nossa Senhora, Ave-Maria',        exercicio:'Renunciar principal apego' },
    { day:31, subtheme:'Fidelidade',                tratado:'Síntese',                 leitura:'Ap 2,10',   oracoes:'Rosário (Gloriosos), Sub Tuum Praesidium',    exercicio:'Planejar perseverança' },
    { day:32, subtheme:'Pureza de intenção',        tratado:'Síntese',                 leitura:'Mt 5,8',    oracoes:'Veni Creator, Ladainha dos Santos',           exercicio:'Confissão sacramental' },
    { day:33, subtheme:'Consagração total',         tratado:'Fórmula de Consagração (São Luís)', leitura:'Lc 1,46-55', oracoes:'Ato de Consagração completo, Rosário completo, Te Deum', exercicio:'Comunhão e consagração solene' },
  ]
}

];

const consecrationDates = [
  { feast:'Anunciação do Senhor',          date:'25 de março',    start:'20 de fevereiro' },
  { feast:'Nossa Senhora de Fátima',        date:'13 de maio',     start:'10 de abril' },
  { feast:'Nossa Senhora do Carmo',         date:'16 de julho',    start:'13 de junho' },
  { feast:'Assunção de Nossa Senhora',      date:'15 de agosto',   start:'13 de julho' },
  { feast:'Natividade de Nossa Senhora',    date:'8 de setembro',  start:'6 de agosto' },
  { feast:'Nossa Senhora do Rosário',       date:'7 de outubro',   start:'4 de setembro' },
  { feast:'Apresentação de Nossa Senhora',  date:'21 de novembro', start:'19 de outubro' },
  { feast:'Imaculada Conceição',            date:'8 de dezembro',  start:'5 de novembro' },
  { feast:'Nossa Senhora de Guadalupe',     date:'12 de dezembro', start:'9 de novembro' },
];

// ── Componentes auxiliares ────────────────────────────────────────────────────
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/60 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/80 transition-colors text-left gap-3">
        <span className="font-semibold text-sm">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-[#5A5A40]" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 text-[#5A5A40]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 pt-1">
              <pre className="text-sm leading-relaxed text-[#1A1A1A]/80 font-serif whitespace-pre-wrap">{children as string}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PrayerCard({ prayer }: { prayer: PrayerItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-[1.5rem] border border-[#1A1A1A]/5 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#F5F2ED]/50 transition-colors text-left gap-3">
        <span className="font-semibold text-sm">{prayer.title}</span>
        {open ? <ChevronUp className="w-4 h-4 flex-shrink-0 text-[#5A5A40]" /> : <ChevronDown className="w-4 h-4 flex-shrink-0 text-[#5A5A40]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 pt-1">
              <pre className="text-sm leading-relaxed text-[#1A1A1A]/80 font-serif whitespace-pre-wrap">{prayer.text}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-abas ──────────────────────────────────────────────────────────────────
function DailyPrayers({ searchTerm, userPrayers, onDeleteUserPrayer }: {
  searchTerm: string;
  userPrayers: UserPrayerItem[];
  onDeleteUserPrayer: (id: number) => void;
}) {
  const q = searchTerm.toLowerCase().trim();

  const [openGroups, setOpenGroups] = useState({ habituais: false, ladainhas: false, formais: false });
  const toggleGroup = (g: keyof typeof openGroups) =>
    setOpenGroups(prev => ({ ...prev, [g]: !prev[g] }));

  const filterPrayers = (prayers: PrayerItem[]) =>
    q ? prayers.filter(p => p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q)) : prayers;
  const filterUserPrayers = (prayers: UserPrayerItem[]) =>
    q ? prayers.filter(p => p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q)) : prayers;

  const userHabituais = filterUserPrayers(userPrayers.filter(p => p.category === 'habituais'));
  const userLadainhas = filterUserPrayers(userPrayers.filter(p => p.category === 'ladainhas'));
  const userFormais   = filterUserPrayers(userPrayers.filter(p => p.category === 'formais'));

  const filtHabituais = filterPrayers(habituais);
  const filtLadainhas = filterPrayers(ladainhas);
  const filtFormais   = filterPrayers(formais);

  const total = filtHabituais.length + userHabituais.length + filtLadainhas.length + userLadainhas.length + filtFormais.length + userFormais.length;

  if (q && total === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-[#1A1A1A]/10">
        <Search className="w-8 h-8 text-[#1A1A1A]/20 mx-auto mb-3" />
        <p className="text-[#1A1A1A]/40 italic text-sm">Nenhuma oração encontrada para "{searchTerm}".</p>
      </div>
    );
  }

  function GroupHeader({ label, groupKey, count }: { label: string; groupKey: keyof typeof openGroups; count: number }) {
    return (
      <button
        onClick={() => toggleGroup(groupKey)}
        className="w-full flex items-center justify-between px-1 py-2 hover:opacity-70 transition-opacity"
      >
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40]">
          {label}{q ? <span className="text-[#1A1A1A]/30 font-normal normal-case ml-1">({count})</span> : null}
        </h3>
        {openGroups[groupKey]
          ? <ChevronUp className="w-4 h-4 text-[#5A5A40] flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-[#5A5A40] flex-shrink-0" />}
      </button>
    );
  }

  const totalHabituais = filtHabituais.length + userHabituais.length;
  const totalLadainhas = filtLadainhas.length + userLadainhas.length;
  const totalFormais   = filtFormais.length   + userFormais.length;

  return (
    <div className="space-y-6">
      {totalHabituais > 0 && (
        <div className="space-y-1">
          <GroupHeader label="Orações Habituais" groupKey="habituais" count={totalHabituais} />
          <AnimatePresence initial={false}>
            {openGroups.habituais && (
              <motion.div key="habituais" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="space-y-2 pt-1">
                  {filtHabituais.map((p, i) => <PrayerCard key={i} prayer={p} />)}
                  {userHabituais.map(p => (
                    <div key={`u_${p.title}_${p.category}`} className="relative group">
                      <PrayerCard prayer={p} />
                      <button onClick={() => onDeleteUserPrayer(p.id)} title="Remover oração"
                        className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 z-10">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {totalLadainhas > 0 && (
        <div className="space-y-1">
          <GroupHeader label="Ladainhas" groupKey="ladainhas" count={totalLadainhas} />
          <AnimatePresence initial={false}>
            {openGroups.ladainhas && (
              <motion.div key="ladainhas" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="space-y-2 pt-1">
                  {filtLadainhas.map((p, i) => <PrayerCard key={i} prayer={p} />)}
                  {userLadainhas.map(p => (
                    <div key={`u_${p.title}_${p.category}`} className="relative group">
                      <PrayerCard prayer={p} />
                      <button onClick={() => onDeleteUserPrayer(p.id)} title="Remover oração"
                        className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 z-10">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {totalFormais > 0 && (
        <div className="space-y-1">
          <GroupHeader label="Orações Formais" groupKey="formais" count={totalFormais} />
          <AnimatePresence initial={false}>
            {openGroups.formais && (
              <motion.div key="formais" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="space-y-2 pt-1">
                  {filtFormais.map((p, i) => <PrayerCard key={i} prayer={p} />)}
                  {userFormais.map(p => (
                    <div key={`u_${p.title}_${p.category}`} className="relative group">
                      <PrayerCard prayer={p} />
                      <button onClick={() => onDeleteUserPrayer(p.id)} title="Remover oração"
                        className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 z-10">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function AdorationModelsTab() {
  const borderColor: Record<string, string> = {
    amber: 'border-amber-200 bg-amber-50',
    olive: 'border-[#5A5A40]/20 bg-[#F5F2ED]',
    purple: 'border-purple-200 bg-purple-50',
  };
  const titleColor: Record<string, string> = {
    amber: 'text-amber-800',
    olive: 'text-[#5A5A40]',
    purple: 'text-purple-800',
  };
  return (
    <div className="space-y-8">
      <p className="text-[#1A1A1A]/60 italic text-sm">Três roteiros completos de Adoração Eucarística para guiar o fiel na presença do Santíssimo Sacramento.</p>
      {adoracaoModels.map((model, mi) => (
        <div key={mi} className={`p-6 rounded-[2rem] border ${borderColor[model.color]}`}>
          <h3 className={`text-xl font-bold mb-1 ${titleColor[model.color]}`}>{model.title}</h3>
          <p className="text-sm italic mb-5 opacity-60">{model.subtitle}</p>
          <div className="space-y-2">
            {model.steps.map((step, si) => (
              <Accordion key={si} title={`${si + 1}. ${step.phase}`}>{step.content}</Accordion>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Chave do localStorage para Consagração (isolada por usuário) ──────────────
function getConsecrationKey(): string {
  try {
    const s = localStorage.getItem('caminho_session');
    const id = s ? (JSON.parse(s)?.user?.id ?? 'anon') : 'anon';
    return `consecration_33days_${id}`;
  } catch { return 'consecration_33days_anon'; }
}

function ConsecrationTab() {
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [openReview, setOpenReview] = useState(false);
  const [openSintese, setOpenSintese] = useState(false);
  const [openAto, setOpenAto] = useState(false);

  // Dias marcados como concluídos — persiste no localStorage
  const [completedDays, setCompletedDays] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(getConsecrationKey());
      if (saved) return new Set(JSON.parse(saved) as number[]);
    } catch {}
    return new Set<number>();
  });

  const toggleDay = (dayNumber: number) => {
    setCompletedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      try { localStorage.setItem(getConsecrationKey(), JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const weekBg: Record<string, string> = {
    gray: 'bg-gray-50 border-gray-200', blue: 'bg-blue-50 border-blue-200',
    rose: 'bg-rose-50 border-rose-200', green: 'bg-green-50 border-green-200',
    gold: 'bg-amber-50 border-amber-200',
  };
  const weekTitle: Record<string, string> = {
    gray: 'text-gray-700', blue: 'text-blue-700',
    rose: 'text-rose-700', green: 'text-green-700', gold: 'text-amber-700',
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#5A5A40] text-white p-7 rounded-[2rem]">
        <h3 className="text-xl font-bold mb-2">Consagração a Jesus Cristo pelas mãos de Maria</h3>
        <p className="text-white/70 italic text-xs mb-3">São Luís Maria Grignion de Montfort — Tratado da Verdadeira Devoção</p>
        <p className="text-white/90 text-sm leading-relaxed">
          São Luís Maria Grignion de Montfort (1673–1716) propõe uma consagração total a Jesus Cristo por meio de Maria: dar a ela tudo o que somos para que ela o ofereça a Jesus de forma mais perfeita. O fruto é a santificação acelerada da alma.
        </p>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-[#1A1A1A]/5">
        <h4 className="font-bold mb-3">Como fazer — Passo a Passo</h4>
        <ol className="text-sm text-[#1A1A1A]/70 space-y-1.5 list-decimal list-inside">
          <li>Escolha a data de consagração nas datas abaixo</li>
          <li>Inicie a preparação de 33 dias antes da data escolhida</li>
          <li>Siga o cronograma de 5 semanas diariamente</li>
          <li>Faça confissão sacramental e comunhão no dia da consagração</li>
          <li>Pronuncie o Ato de Consagração (fórmula de Montfort)</li>
          <li>Renove a consagração anualmente na mesma data</li>
        </ol>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-[#1A1A1A]/5">
        <h4 className="font-bold mb-4">Datas de Consagração e Início da Preparação</h4>
        <div className="space-y-2">
          {consecrationDates.map((d, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#F5F2ED] rounded-xl gap-1">
              <div>
                <p className="font-semibold text-sm">{d.feast}</p>
                <p className="text-xs text-[#5A5A40]">Consagração: {d.date}</p>
              </div>
              <p className="text-xs text-[#1A1A1A]/50 italic">Iniciar em: {d.start} (33 dias antes)</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Revisão Geral do Tratado ─────────────────────────────────────── */}
      <div className="bg-white rounded-[2rem] border border-[#1A1A1A]/5 overflow-hidden">
        <button
          onClick={() => setOpenReview(v => !v)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-[#F5F2ED]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📖</span>
            <div>
              <p className="font-bold">Revisão Geral do Tratado</p>
              <p className="text-xs text-[#1A1A1A]/40">Fichamento da Verdadeira Devoção — São Luís de Montfort</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-[#5A5A40] transition-transform ${openReview ? 'rotate-180' : ''}`} />
        </button>
        {openReview && (
          <div className="px-5 pb-6 space-y-5 text-sm leading-relaxed text-[#1A1A1A]/80">
            {[
              { title: 'I. Período Preliminar: Desapego do Mundo', items: [
                { ref: '§78 (A Necessidade de Purificação)', text: '"As nossas melhores ações são geralmente manchadas e corrompidas pela má inclinação que há em nós... É de extrema importância esvaziarmo-nos do que temos de mau, senão Nosso Senhor, que é infinitamente puro e odeia a menor mancha na alma, não poderá habitar em nós."' },
                { ref: '§80 (A Renúncia)', text: '"Para nos esvaziarmos de nós mesmos, é preciso morrer todos os dias a nossos sentimentos e faculdades. É preciso não ver como se não víssemos, não ouvir como se não ouvíssemos, e não usar das coisas deste mundo como se delas não usássemos."' },
                { ref: '§100 (O Perigo da Falsa Devoção)', text: '"O mundo está cheio de devotos presunçosos que, sob o pretexto de serem devotos da Santíssima Virgem, se entregam ao pecado e não se esforçam por se emendar."' },
                { ref: '§110 (A Pureza de Intenção)', text: '"A verdadeira devoção é desinteressada, isto é, não move a alma a buscar-se a si mesma, mas somente a Deus em Sua Santíssima Mãe."' },
                { ref: '§120 (A Meta Final)', text: '"Toda a nossa perfeição consiste em sermos conformados, unidos e consagrados a Jesus Cristo. Por isso, a mais perfeita de todas as devoções é, indiscutivelmente, aquela que nos conforma, une e consagra mais perfeitamente a Jesus Cristo."' },
              ]},
              { title: 'II. Primeira Semana: Conhecimento de Si Mesmo', items: [
                { ref: '§79 (A Raiz do Mal Interior)', text: '"Somos todos feitos de lama e de corrupção... temos em nós um fundo de orgulho e de amor-próprio que nos torna indignos de aparecer diante de Deus."' },
                { ref: '§81 (O Valor da Humildade)', text: '"Deus resiste aos soberbos, mas dá a Sua graça aos humildes. Ora, tu não podes ser verdadeiramente humilde sem te conheceres tal qual és."' },
                { ref: '§213 (A Graça do Autoconhecimento)', text: '"Pela luz que o Espírito Santo te dará por meio de Maria... conhecerás a tua má semente, a tua corrupção e incapacidade para todo o bem."' },
                { ref: '§223 (A Dependência)', text: '"Nada somos por nós mesmos, nada temos senão pecado e miséria. Por isso, temos necessidade de um apoio seguro para não cairmos a cada passo."' },
              ]},
              { title: 'III. Segunda Semana: Conhecimento de Maria', items: [
                { ref: '§1 (A Porta de Entrada)', text: '"Foi por intermédio da Santíssima Virgem Maria que Jesus Cristo veio ao mundo, e é também por meio dela que deve reinar no mundo."' },
                { ref: '§50 (O Segredo de Maria)', text: '"Maria é o santuário e o repouso da Santíssima Trindade, onde Deus está mais magnífica e divinamente que em qualquer outro lugar do universo."' },
                { ref: '§152 (O Caminho Fácil)', text: '"Maria é o caminho fácil, curto, perfeito e seguro para chegar à união com Deus, em que consiste a perfeição cristã."' },
                { ref: '§219 (A Metáfora do Molde)', text: '"Maria é o grande molde de Deus, feito pelo Espírito Santo, para formar ao natural um Deus feito homem pela União Hipostática, e para formar um homem-Deus pela graça."' },
              ]},
              { title: 'IV. Terceira Semana: Conhecimento de Jesus Cristo', items: [
                { ref: '§61 (Cristocentrismo)', text: '"Jesus Cristo, nosso Salvador, verdadeiro Deus e verdadeiro homem, deve ser o fim último de todas as nossas devoções; de outra sorte, seriam falsas e enganadoras."' },
                { ref: '§64 (A Submissão de Cristo)', text: '"Jesus Cristo deu mais glória a Deus, seu Pai, submetendo-se a Maria durante trinta anos, do que se tivesse convertido toda a terra operando os maiores prodígios."' },
                { ref: '§118 (A Sabedoria Encarnada)', text: '"Conhecer a Jesus Cristo, a Sabedoria encarnada, é saber tudo; não o conhecer é nada saber, ainda que se saiba tudo o mais."' },
                { ref: '§121 (A Entrega no Batismo)', text: '"Toda a nossa perfeição consiste em renovar as promessas do santo Batismo, e esta devoção consiste em nos darmos inteiramente a Maria para sermos todos de Jesus por meio d\'Ela."' },
              ]},
              { title: 'V. Semana Final: Preparação para a Consagração', items: [
                { ref: '§126 (A Escravidão de Amor)', text: '"Devemos dar-lhe: 1º o nosso corpo... 2º a nossa alma... 3º os nossos bens exteriores... 4º os nossos bens interiores e espirituais."' },
                { ref: '§158 (A Conservação da Graça)', text: '"Maria é a virgem fiel que, por sua fidelidade a Deus, repara as perdas que a Eva infiel causou por sua desobediência. Ela guarda e conserva os tesouros que Lhe confiamos."' },
                { ref: '§257 (Agir Por Maria)', text: '"É preciso fazer todas as ações por Maria, isto é, obedecer-lhe em tudo e conduzir-se em tudo pelo seu espírito, que é o Espírito Santo de Deus."' },
                { ref: '§261 (Agir Em Maria)', text: '"É preciso fazer todas as coisas em Maria... para que ela se torne o lugar onde a alma reza, age e repousa, para que nela encontre a Deus."' },
              ]},
            ].map((sec, si) => (
              <div key={si} className="border-l-2 border-[#5A5A40]/20 pl-4 space-y-3">
                <p className="font-bold text-[#5A5A40] text-xs uppercase tracking-widest">{sec.title}</p>
                {sec.items.map((item, ii) => (
                  <div key={ii}>
                    <p className="text-[11px] font-bold text-[#1A1A1A]/50 mb-1">{item.ref}</p>
                    <p className="italic">{item.text}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Síntese Espiritual ────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2rem] border border-[#1A1A1A]/5 overflow-hidden">
        <button
          onClick={() => setOpenSintese(v => !v)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-[#F5F2ED]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">✨</span>
            <div>
              <p className="font-bold">Síntese Espiritual</p>
              <p className="text-xs text-[#1A1A1A]/40">O Caminho da Consagração — fase por fase</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-[#5A5A40] transition-transform ${openSintese ? 'rotate-180' : ''}`} />
        </button>
        {openSintese && (
          <div className="px-5 pb-6 space-y-5 text-sm leading-relaxed text-[#1A1A1A]/80">
            <p className="italic text-[#1A1A1A]/60 border-l-4 border-[#5A5A40]/30 pl-4">
              O objetivo central do Tratado é a perfeita renovação das promessas do Batismo pelas mãos de Maria. São Luís propõe que, para ser de Jesus, precisamos deixar de ser "de nós mesmos".
            </p>
            {[
              { n: '1.', title: 'Período Preliminar: Desapego do Mundo (Purificação)', sinteseText: 'O mundo nos escraviza através do orgulho, da concupiscência e da vaidade. Esta etapa é um "detox" da alma. Não se pode colocar o vinho novo de Cristo em odres velhos e mundanos.', keyPar: '§78-79: "As nossas melhores ações são geralmente manchadas e corrompidas pela má inclinação que há em nós... É de extrema importância esvaziarmo-nos do que temos de mau, senão Nosso Senhor, que é infinitamente puro, não poderá habitar em nós."' },
              { n: '2.', title: 'Primeira Semana: Conhecimento de Si Mesmo (Humildade)', sinteseText: 'Aqui a alma olha para o espelho da verdade. Percebemos que, por nós mesmos, somos instáveis e inclinados ao egoísmo. A humildade não é sentir-se mal, mas reconhecer a verdade de que precisamos de ajuda divina.', keyPar: '§213: "Pela luz que o Espírito Santo te dará por meio de Maria... conhecerás a tua má semente, a tua corrupção e incapacidade para todo o bem. Tu te olharás como um caracol que tudo suja com sua baba, ou como um sapo que tudo envenena com seu veneno."' },
              { n: '3.', title: 'Segunda Semana: Conhecimento de Maria (Devoção Verdadeira)', sinteseText: 'Maria não é um obstáculo entre nós e Deus, mas o caminho mais curto. Conhecê-la é entender que ela é a criatura que melhor glorifica o Criador.', keyPar: '§219: "Maria é o grande molde de Deus, feito pelo Espírito Santo, para formar ao natural um Deus feito homem... e para formar também um homem-Deus pela graça. A alma que encontra este molde e nele se lança, em pouco tempo torna-se uma imagem viva de Jesus Cristo."' },
              { n: '4.', title: 'Terceira Semana: Conhecimento de Jesus Cristo', sinteseText: 'Todo o esforço anterior deságua aqui. O devoto olha para Jesus como o Verbo Encarnado e o seu Único Mestre. Através de Maria, o conhecimento de Jesus deixa de ser teórico e torna-se íntimo.', keyPar: '§61: "Jesus Cristo, nosso Salvador, verdadeiro Deus e verdadeiro homem, deve ser o fim último de todas as nossas devoções... Se alguém estabelecesse a sólida devoção à Santíssima Virgem, era apenas para estabelecer mais perfeitamente a de Jesus Cristo."' },
            ].map((phase, pi) => (
              <div key={pi} className="bg-[#F5F2ED] rounded-2xl p-4 space-y-2">
                <p className="font-bold text-[#5A5A40]">{phase.n} {phase.title}</p>
                <p>{phase.sinteseText}</p>
                <p className="text-[11px] italic text-[#1A1A1A]/50 border-t border-[#1A1A1A]/10 pt-2">{phase.keyPar}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Ato de Consagração Final ──────────────────────────────────────── */}
      <div className="bg-white rounded-[2rem] border border-[#5A5A40]/20 overflow-hidden">
        <button
          onClick={() => setOpenAto(v => !v)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-[#F5F2ED]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📜</span>
            <div>
              <p className="font-bold text-[#5A5A40]">Ato de Consagração Final</p>
              <p className="text-xs text-[#1A1A1A]/40">Fórmula de São Luís Maria de Montfort — para o Dia 33</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-[#5A5A40] transition-transform ${openAto ? 'rotate-180' : ''}`} />
        </button>
        {openAto && (
          <div className="px-5 pb-6 space-y-4 text-sm leading-loose text-[#1A1A1A]/80 font-serif">
            <p className="text-[11px] font-sans font-bold text-[#5A5A40] uppercase tracking-widest text-center pb-2 border-b border-[#5A5A40]/10">
              Ato de Consagração de si mesmo a Jesus Cristo, Sabedoria Encarnada, pelas mãos de Maria
            </p>
            {[
              'Ó Sabedoria eterna e encarnada! Ó amabilíssimo e adorável Jesus, verdadeiro Deus e verdadeiro homem, Filho único do Pai Eterno e da sempre Virgem Maria! Adoro-Vos profundamente no seio e nos esplendores de Vosso Pai, durante a eternidade, e no seio virginal de Maria, Vossa digníssima Mãe, no tempo de Vossa Encarnação.',
              'Eu Vos dou graças por Vos terdes aniquilado a Vós mesmo, tomando a forma de escravo, para me livrardes do cruel cativeiro do demônio. Eu Vos louvo e glorifico por Vos terdes querido submeter a Maria, Vossa Santa Mãe, em todas as coisas, a fim de, por Ela, me tornardes Vosso fiel escravo.',
              'Mas, ai de mim! Criatura ingrata e infiel, não guardei as promessas que tão solenemente fiz no meu Batismo; não cumpri as minhas obrigações; não mereço ser chamado Vosso filho, nem Vosso escravo; e, como nada há em mim que não mereça a Vossa repulsa e a Vossa cólera, não ouso aproximar-me por mim mesmo da Vossa santíssima e augustíssima Majestade.',
              'É por esta razão que recorro à intercessão de Vossa Mãe Santíssima, que me destes para mediadora junto de Vós; e é por meio d\'Ela que espero obter de Vós a contrição e o perdão dos meus pecados, a aquisição e a conservação da Sabedoria.',
              'Ave, pois, ó Maria Imaculada, Tabernáculo vivo da Divindade, onde a Sabedoria eterna escondida quer ser adorada pelos anjos e pelos homens! Ave, ó Rainha do céu e da terra, a cujo império tudo está submetido, tanto quanto está abaixo de Deus! Ave, ó refúgio seguro dos pecadores, cuja misericórdia a ninguém falece! Atendei aos desejos que tenho da divina Sabedoria, e recebei, para esse fim, os votos e ofertas que a minha baixeza Vos apresenta.',
              'Eu, _____________________, pecador infiel, renovo e ratifico hoje, em Vossas mãos, os votos do meu Batismo; renuncio para sempre a Satanás, às suas pompas e às suas obras; e dou-me inteiramente a Jesus Cristo, a Sabedoria Encarnada, para levar a minha cruz atrás d\'Ele todos os dias da minha vida, e para Lhe ser mais fiel do que tenho sido até agora.',
              'Escolho-Vos hoje, ó Maria, na presença de toda a corte celeste, para minha Mãe e minha Senhora. Entrego-Vos e consagro-Vos, na qualidade de escravo, o meu corpo e a minha alma, os meus bens interiores e exteriores, e o próprio valor das minhas boas obras passadas, presentes e futuras, deixando-Vos pleno e inteiro direito de dispor de mim e de tudo o que me pertence, sem exceção, à Vossa vontade, para maior glória de Deus, no tempo e na eternidade.',
              'Recebei, ó Virgem benigna, esta pequena oferta da minha escravidão, em união com a submissão que a Sabedoria eterna quis ter à Vossa maternidade; em homenagem ao poder que ambos tendes sobre este vermezinho e miserável pecador; e em ação de graças pelos privilégios com que a Santíssima Trindade Vos favoreceu. Protesto que quero, daqui em diante e como Vosso verdadeiro escravo, buscar a Vossa honra e obedecer-Vos em todas as coisas.',
              'Ó Mãe admirável! Apresentai-me ao Vosso amado Filho, na qualidade de escravo eterno, para que, tendo-me resgatado por Vós, por Vós me receba. Ó Mãe de misericórdia! Concedei-me a graça de obter a verdadeira Sabedoria de Deus, e de me colocar, para esse fim, no número daqueles que amais, ensinais, guiais, alimentais e protegeis como Vossos filhos e Vossos escravos.',
              'Ó Virgem fiel! Tornai-me em todas as coisas um tão perfeito discípulo, imitador e escravo da Sabedoria Encarnada, Jesus Cristo, Vosso Filho, que eu chegue, por Vossa intercessão e a Vosso exemplo, à plenitude da Sua idade na terra e da Sua glória nos céus. Assim seja.',
            ].map((para, pi) => (
              <p key={pi} className={pi === 5 ? 'bg-[#F5F2ED] rounded-xl px-4 py-3 font-bold' : ''}>{para}</p>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-lg">Cronograma de 33 Dias</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5A5A40]">{completedDays.size}/33 dias</span>
            {completedDays.size > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Deseja limpar todo o progresso do cronograma?')) {
                    setCompletedDays(new Set());
                    try { localStorage.removeItem(getConsecrationKey()); } catch {}
                  }
                }}
                className="text-[10px] text-red-400 hover:text-red-600 font-bold"
              >Limpar</button>
            )}
          </div>
        </div>
        {completedDays.size > 0 && (
          <div className="mb-4">
            <div className="h-2 bg-[#F5F2ED] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5A5A40] rounded-full transition-all duration-500"
                style={{ width: `${(completedDays.size / 33) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#1A1A1A]/40 mt-1 text-right">
              {completedDays.size === 33 ? '🎉 Cronograma concluído!' : `${Math.round((completedDays.size / 33) * 100)}% concluído`}
            </p>
          </div>
        )}
        <div className="space-y-3">
          {consecrationSchedule.map((week, wi) => (
            <div key={wi} className={`rounded-[2rem] border overflow-hidden ${weekBg[week.color]}`}>
              <button onClick={() => setOpenWeek(openWeek === wi ? null : wi)}
                className="w-full flex items-center justify-between p-5 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-bold ${weekTitle[week.color]}`}>{week.week}</p>
                    {(() => {
                      const doneCount = week.days.filter(d => completedDays.has(d.day)).length;
                      const total = week.days.length;
                      const allDone = doneCount === total;
                      return (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${allDone ? 'bg-green-100 text-green-700' : 'bg-white/70 text-[#1A1A1A]/50'}`}>
                          {doneCount}/{total}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-[#1A1A1A]/50 mt-0.5 italic">{week.theme}</p>
                </div>
                {openWeek === wi ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
              </button>
              <AnimatePresence>
                {openWeek === wi && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-2">
                      {week.days.map((day, di) => {
                        const key = wi * 10 + di;
                        return (
                          <div key={di} className={`rounded-2xl overflow-hidden transition-colors ${completedDays.has(day.day) ? 'bg-green-50/80' : 'bg-white/80'}`}>
                            <div className="flex items-center">
                              {/* Botão de marcar como feito */}
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); toggleDay(day.day); }}
                                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                                onPointerDown={e => { e.preventDefault(); e.stopPropagation(); }}
                                title={completedDays.has(day.day) ? 'Desmarcar' : 'Marcar como realizado'}
                                className="flex-shrink-0 pl-3 pr-1 py-3 flex items-center"
                              >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                  completedDays.has(day.day)
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'bg-white border-[#5A5A40]/30 text-[#5A5A40]'
                                }`}>
                                  {completedDays.has(day.day) ? '✓' : day.day}
                                </div>
                              </button>
                              {/* Botão de abrir detalhes */}
                              <button onClick={e => { e.preventDefault(); e.stopPropagation(); setOpenDay(openDay === key ? null : key); }}
                                className="flex items-center gap-2 flex-1 p-3 text-left hover:bg-white/60 transition-colors min-w-0">
                                <span className={`font-semibold text-sm flex-1 ${completedDays.has(day.day) ? 'line-through text-[#1A1A1A]/40' : ''}`}>{day.subtheme}</span>
                                {openDay === key ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0 text-[#5A5A40]" /> : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-[#1A1A1A]/30" />}
                              </button>
                            </div>
                            <AnimatePresence>
                              {openDay === key && (
                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                  <div className="px-5 pb-4 space-y-3 border-t border-[#1A1A1A]/5">
                                    {[
                                      { label: 'Capítulo do Tratado', value: day.tratado },
                                      { label: 'Leitura / Reflexão', value: day.leitura },
                                      { label: 'Orações e Práticas', value: day.oracoes },
                                      { label: 'Exercício / Resolução Prática', value: day.exercicio },
                                    ].map((item, idx) => (
                                      <div key={idx} className="pt-2">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] mb-1">{item.label}</p>
                                        <p className="text-sm text-[#1A1A1A]/70">{item.value}</p>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// RITOS LITÚRGICOS — dados e componente
// ─────────────────────────────────────────────────────────────────────────────

interface RitoSection { title: string; content: string; }
interface RitoSubgroup { id: string; title: string; icon: string; sections: RitoSection[]; }

const ritosData: RitoSubgroup[] = [

// ── 1. ORDINÁRIO DA MISSA ────────────────────────────────────────────────────
{
  id: 'missa',
  title: 'Ordinário da Missa',
  icon: '✝️',
  sections: [
    {
      title: 'RITOS INICIAIS — 1. Saudação',
      content: `Em nome do Pai e do Filho e do Espírito Santo.
As: Amém!

OP01 — PR: A graça de nosso Senhor Jesus Cristo, o amor do Pai e a comunhão do Espírito Santo estejam convosco.
OP02 — PR: O Deus da esperança, que nos cumula de toda alegria e paz em nossa fé, pela ação do Espírito Santo, esteja convosco.
As: Bendito seja Deus, que nos reuniu no amor de Cristo!
Pr: O Senhor esteja convosco.
As: Ele está no meio de nós!

O bispo, nesta primeira saudação, em vez de "O Senhor esteja convosco", diz:
Pr: A paz esteja convosco.
As: Bendito seja Deus, que nos reuniu no amor de Cristo!`,
    },
    {
      title: '2. Ato Penitencial',
      content: `OP01 — Pr: Irmãos e irmãs, reconheçamos os nossos pecados, para celebrarmos dignamente os santos mistérios (pausa).
Confessemos os nossos pecados:
As: Confesso a Deus todo-poderoso e a vós, irmãos e irmãs, que pequei muitas vezes por pensamentos e palavras, atos e omissões, (e, batendo no peito, dizem:) por minha culpa, minha culpa, minha tão grande culpa. E peço à Virgem Maria, aos anjos e santos e a vós, irmãos e irmãs, que rogueis por mim a Deus, nosso Senhor.

Pr: Deus todo-poderoso tenha compaixão de nós, perdoe os nossos pecados e nos conduza à vida eterna.
As: Amém!
Pr: Senhor, tende piedade de nós (ou: Kýrie, eléison).
As: Senhor, tende piedade de nós.
Pr: Cristo, tende piedade de nós (ou: Christe, eleison).
As: Cristo, tende piedade de nós.
Pr: Senhor, tende piedade de nós (ou: Kyrie, eleison).
As: Senhor, tende piedade de nós.

OP02 — Pr: Em Jesus Cristo, o Justo, que intercede por nós e nos reconcilia com o Pai, abramos o nosso espírito ao arrependimento para sermos dignos de nos aproximar da mesa do Senhor (pausa).
Pr: Senhor, que viestes salvar os corações arrependidos, tende piedade de nós.
As: Senhor, tende piedade de nós!
Pr: Cristo, que viestes chamar os pecadores, tende piedade de nós.
As: Cristo, tende piedade de nós!
Pr: Senhor, que intercedeis por nós junto do Pai, tende piedade de nós.
As: Senhor, tende piedade de nós!
Pr: Deus todo-poderoso...
As: Amém.

OP03 — (tempo da Páscoa)
Pr: Senhor, nossa paz, tende piedade de nós.
As: Senhor, tende piedade de nós!
Pr: Cristo, nossa Páscoa, tende piedade de nós.
As: Cristo, tende piedade de nós!
Pr: Senhor, nossa vida, tende piedade de nós.
As: Senhor, tende piedade de nós!

OP04 — Pr: Senhor, que sois o eterno sacerdote da Nova Aliança, tende piedade de nós.
As: Senhor, tende piedade de nós!
Pr: Cristo, que nos edificais como pedras vivas no templo santo de Deus, tende piedade de nós.
As: Cristo, tende piedade de nós!
Pr: Senhor, que nos tornais concidadãos dos santos no Reino dos Céus, tende piedade de nós.
As: Senhor, tende piedade de nós!`,
    },
    {
      title: '3. Glória',
      content: `As: Glória a Deus nas alturas, e paz na terra aos homens por ele amados. Senhor Deus, rei dos céus, Deus Pai todo-poderoso: nós vos louvamos, nós vos bendizemos, nós vos adoramos, nós vos glorificamos, nós vos damos graças por vossa imensa glória. Senhor Jesus Cristo, Filho unigênito, Senhor Deus, Cordeiro de Deus, Filho de Deus Pai. Vós que tirais o pecado do mundo, tende piedade de nós. Vós que tirais o pecado do mundo, acolhei a nossa súplica. Vós que estais à direita do Pai, tende piedade de nós. Só vós sois o Santo, só vós, o Senhor, só vós, o Altíssimo, Jesus Cristo, com o Espírito Santo, na glória de Deus Pai. Amém.`,
    },
    {
      title: '4. Coleta — 5. Leitura — 6. Evangelho (próprios do dia)',
      content: `4 — COLETA (própria do dia)

LITURGIA DA PALAVRA

5 — LEITURA (próprias do dia)
6 — EVANGELHO (próprio do dia)`,
    },
    {
      title: '7. Profissão de Fé (Credo dos Apóstolos)',
      content: `Creio em Deus Pai todo poderoso, criador do céu e da terra, e em Jesus Cristo, seu único Filho, nosso Senhor, (breve inclinação até "da Virgem Maria") que foi concebido pelo poder do Espírito Santo; nasceu da Virgem Maria; padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus; está sentado à direita de Deus Pai todo-poderoso, donde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo, na santa Igreja católica, na comunhão dos santos, na remissão dos pecados, na ressurreição da carne, na vida eterna. Amém.`,
    },
    {
      title: 'LITURGIA EUCARÍSTICA — 8. Preparação das Oferendas',
      content: `Pr: Bendito sejais, Senhor, Deus do universo, pelo pão que recebemos de vossa bondade, fruto da terra e do trabalho humano, que agora vos apresentamos e para nós se vai tornar pão da vida.
As: Bendito seja Deus para sempre!
Pr: Pelo mistério desta água e deste vinho, possamos participar da divindade do vosso Filho, que se dignou assumir a nossa humanidade.
Pr: Bendito sejais, Senhor, Deus do universo, pelo vinho que recebemos de vossa bondade, fruto da videira e do trabalho humano, que agora vos apresentamos e para nós se vai tornar vinho da salvação.
As: Bendito seja Deus para sempre!
Pr: De coração contrito e humilde, sejamos, Senhor, acolhidos por vós; e seja o nosso sacrifício de tal modo oferecido, que vos agrade, Senhor, nosso Deus. Lavai-me, Senhor, de minhas faltas e purificai-me do meu pecado.
Pr: Orai, irmãos e irmãs, para que o meu e vosso sacrifício seja aceito por Deus Pai todo-poderoso.
As: Receba o Senhor por tuas mãos este sacrifício, para glória do seu nome, para nosso bem e de toda a sua santa Igreja.

9 — SOBRE AS OFERENDAS (própria do dia)`,
    },
    {
      title: '10. Oração Eucarística — Diálogo Introdutório e Prefácios',
      content: `Pr: O Senhor esteja convosco.
As: Ele está no meio de nós!
Pr: Corações ao alto.
As: Nosso coração está em Deus!
Pr: Demos graças ao Senhor, nosso Deus.
As: É nosso dever e nossa salvação!

PREFÁCIO DOS DEFUNTOS III (Cristo, salvação e vida):
Na verdade, é digno e justo, é nosso dever e salvação dar-vos graças, sempre e em todo lugar, Senhor, Pai santo, Deus eterno e todo-poderoso, por Cristo, Senhor nosso. Ele é a salvação do mundo, a vida da humanidade, a ressurreição dos mortos. Por ele os coros dos anjos adoram a vossa grandeza e se alegram eternamente na vossa presença. Concedei-nos, também a nós, associar-nos a seus louvores, cantando (dizendo) a uma só voz:

PREFÁCIO DOS APÓSTOLOS II:
Na verdade, é digno e justo, é nosso dever e salvação dar-vos graças, sempre e em todo lugar, Senhor, Pai santo, Deus eterno e todo-poderoso, por Cristo, Senhor nosso. Vós fundastes a Igreja sobre o alicerce dos apóstolos, a fim de que ela seja na terra sinal permanente da vossa santidade e anuncie a todo o mundo o Evangelho do Reino dos Céus. Por isso, agora e sempre, com todos os coros dos anjos, jubilosos cantamos (dizemos) a uma só voz:

PREFÁCIO DOS SANTOS II:
Na verdade, é digno e justo, é nosso dever e salvação dar-vos graças, sempre e em todo lugar, Senhor, Pai santo, Deus eterno e todo-poderoso, por Cristo, Senhor nosso. Pois, pelo testemunho admirável dos vossos santos e santas, sempre fecundais com novo vigor a vossa Igreja e nos dais provas evidentes do vosso amor. Para levar à plenitude o mistério da salvação, o exemplo dos santos nos estimula e sua intercessão constantemente nos ajuda. Por isso, também nós, Senhor, com todos os anjos e santos, jubilosos vos louvamos, cantando (dizendo) a uma só voz:

PREFÁCIO DOS MÁRTIRES I:
Na verdade, é digno e justo, é nosso dever e salvação dar-vos graças, sempre e em todo lugar, Senhor, Pai santo, Deus eterno e todo-poderoso. O sangue que o/a santo/a mártir (...) derramou, à imitação de Cristo, para a glória do vosso nome, manifesta as vossas maravilhas; assim, transformais a fragilidade humana em força e aos fracos dais coragem para o testemunho, por Cristo, Senhor nosso. Por isso, com as Virtudes celestes, vos celebramos na terra louvando vossa majestade, cantando (dizendo) a uma só voz:

PREFÁCIO DOS PASTORES I:
Na verdade, é digno e justo, é nosso dever e salvação dar-vos graças, sempre e em todo lugar, Senhor, Pai santo, Deus eterno e todo-poderoso, por Cristo, Senhor nosso. Vós nos concedeis a alegria de celebrar a memória (festa, solenidade) de São (...) e fortaleceis a vossa Igreja com o exemplo de sua vida, o ensinamento de sua pregação e o auxílio de suas preces. Por isso, com a multidão dos anjos e dos santos, entoamos o hino da vossa glória, cantando (dizendo) a uma só voz:

PREFÁCIO DOS DOUTORES DA IGREJA II:
Na verdade, é digno e justo, é nosso dever e salvação dar-vos graças, sempre e em todo lugar, Senhor, Pai santo, Deus eterno e todo-poderoso, por Cristo, Senhor nosso. O vosso Filho é o único Mestre: a sua palavra é lâmpada para nossos passos, a sua cruz, somente ela, é nossa sabedoria. Em vosso desígnio de amor, iluminastes S. (...) e alegrais a vossa Igreja com sua doutrina na sublime beleza do vosso Conhecimento. Por este sinal da vossa bondade, unidos aos anjos e aos santos, entoamos o hino da vossa glória, cantando (dizendo) a uma só voz:

PREFÁCIO DA PAIXÃO II (a vitória da paixão):
Na verdade, é digno e justo, é nosso dever e salvação dar-vos graças, sempre e em todo lugar, Senhor, Pai santo, Deus eterno e todo-poderoso, por Cristo, Senhor nosso. Pois sabemos que já se aproximam os dias de sua paixão salvadora e de sua gloriosa ressurreição; dias em que é vencido o poder do antigo inimigo e é celebrado o mistério da nossa redenção. Por ele os coros dos anjos, alegrando-se eternamente na vossa presença, adoram a vossa grandeza. Concedei-nos, também a nós, associar-nos a seus louvores cantando (dizendo) a uma só voz:

PREFÁCIO DA PÁSCOA I (o mistério pascal):
Na verdade, é digno e justo, é nosso dever e salvação proclamar vossa glória, ó Pai, em todo tempo, mas, com maior júbilo, louvar-vos nesta noite (neste dia ou neste tempo), porque Cristo, nossa Páscoa, foi imolado. É ele o verdadeiro Cordeiro, que tirou o pecado do mundo; morrendo, destruiu a nossa morte e, ressurgindo, restaurou a vida. Por isso, transbordando de alegria pascal, exulta a criação por toda a terra; também as Virtudes celestes e as Potestades angélicas proclamam um hino à vossa glória, cantando (dizendo) a uma só voz:

PREFÁCIO DA PÁSCOA II (a vida nova em Cristo):
Na verdade, é digno e justo, é nosso dever e salvação proclamar vossa glória, ó Pai, em todo tempo, mas, com maior júbilo, louvar-vos neste tempo, porque Cristo, nossa Páscoa, foi para a vida eterna e para os vossos fiéis imolado. Por ele os filhos da luz nascem, abrem-se as portas do Reino dos Céus. Nossa morte foi redimida pela sua, e para todos ressurgiu a vida. Por isso, transbordando de alegria pascal, exulta a criação por toda a terra; também as Virtudes celestes e as Potestades angélicas proclamam um hino à vossa glória, cantando (dizendo) a uma só voz:

PREFÁCIO DA PÁSCOA III (o Cristo vivo, que sempre intercede por nós):
Na verdade, é digno e justo, é nosso dever e salvação proclamar vossa glória, ó Pai, em todo tempo, mas, com maior júbilo, louvar-vos neste tempo, porque Cristo, nossa Páscoa, foi imolado. Ele continua a oferecer-se por nós, e junto de vós é nosso eterno defensor. Imolado, já não morre; e, morto, agora vive eternamente. Por isso, transbordando de alegria pascal, exulta a criação por toda a terra; também as Virtudes celestes e as Potestades angélicas proclamam um hino à vossa glória, cantando (dizendo) a uma só voz:

PREFÁCIO DA PÁSCOA IV (a restauração do universo pelo mistério pascal):
Na verdade, é digno e justo, é nosso dever e salvação proclamar vossa glória, ó Pai, em todo tempo, mas, com maior júbilo, louvar-vos neste tempo, porque Cristo, nossa Páscoa, foi imolado. Pois, destruído o que era velho, toda a criação decaída é renovada e em Cristo nos foi recuperada a integridade da vida. Por isso, transbordando de alegria pascal, exulta a criação por toda a terra; também as Virtudes celestes e as Potestades angélicas proclamam um hino à vossa glória, cantando (dizendo) a uma só voz:`,
    },
    {
      title: 'Oração Eucarística I (Missal, p. 523)',
      content: `Pr: Pai de misericórdia, a quem sobem nossos louvores, suplicantes vos rogamos e pedimos por Jesus Cristo, vosso Filho e Senhor nosso, que aceiteis e abençoeis estes dons, estas oferendas, este sacrifício puro e santo, que oferecemos, antes de tudo, pela vossa Igreja santa e católica: concedei-lhe paz e proteção, unindo-a num só corpo e governando-a por toda a terra, em comunhão com vosso servo o papa (...), o nosso bispo (...) e todos os que guardam a fé católica que receberam dos apóstolos.
As: Abençoai nossa oferenda, ó Senhor!

Pr: Lembrai-vos, ó Pai, dos vossos filhos e filhas (...) e de todos os que circundam este altar, dos quais conheceis a fé e a dedicação ao vosso serviço. Por eles nós vos oferecemos e também eles vos oferecem este sacrifício de louvor por si e por todos os seus, e elevam a vós as suas preces, Deus eterno, vivo e verdadeiro, para alcançar o perdão de suas faltas, a segurança em suas vidas e a salvação que esperam.
As: Lembrai-vos, ó Pai, dos vossos filhos!

Pr (Comunhão com a Igreja — Domingos):
Em comunhão com toda a Igreja, celebramos o glorioso dia em que o Senhor Jesus venceu a morte e nos tornou participantes de sua vida imortal. Veneramos, em primeiro lugar, a memória da Mãe de nosso Deus e Senhor Jesus Cristo, a gloriosa sempre Virgem Maria, a de seu esposo, São José, e também a dos santos apóstolos e mártires: Pedro e Paulo, André e a de todos os vossos santos. Por seus méritos e preces, concedei-nos sem cessar a vossa proteção.
As: Em comunhão com vossos santos, vos louvamos!

Pr: Aceitai, ó Pai, com bondade, a oblação dos vossos servos e de toda a vossa família; dai-nos sempre a vossa paz, livrai-nos da condenação eterna e acolhei-nos entre os vossos eleitos.
As: Enviai o vosso Espírito Santo!

Pr (Consagração — Corpo):
Na véspera de sua paixão, ele tomou o pão em suas santas e veneráveis mãos, elevou os olhos ao céu, a vós, ó Pai todo-poderoso, pronunciou a bênção de ação de graças, partiu o pão e o deu a seus discípulos, dizendo:
TOMAI, TODOS, E COMEI: ISTO É O MEU CORPO, QUE SERÁ ENTREGUE POR VÓS.

Pr (Consagração — Sangue):
Do mesmo modo, no fim da Ceia, ele tomou este precioso cálice em suas santas e veneráveis mãos, pronunciou novamente a bênção de ação de graças e o deu a seus discípulos, dizendo:
TOMAI, TODOS, E BEBEI: ESTE É O CÁLICE DO MEU SANGUE, O SANGUE DA NOVA E ETERNA ALIANÇA, QUE SERÁ DERRAMADO POR VÓS E POR TODOS PARA REMISSÃO DOS PECADOS. FAZEI ISTO EM MEMÓRIA DE MIM.

OP01 — Mistério da fé!
As: Anunciamos, Senhor, a vossa morte e proclamamos a vossa ressurreição. Vinde, Senhor Jesus!
OP02 — Mistério da fé e do amor!
As: Todas as vezes que comemos deste pão e bebemos deste cálice, anunciamos, Senhor, a vossa morte, enquanto esperamos a vossa vinda!
OP03 — Mistério da fé para a salvação do mundo!
As: Salvador do mundo, salvai-nos, vós que nos libertastes pela cruz e ressurreição!

Pr: Celebrando, pois, a memória da bem-aventurada paixão do vosso Filho, da sua ressurreição dentre os mortos e gloriosa ascensão aos céus, nós, vossos servos, e também vosso povo santo, vos oferecemos, ó Pai, dentre os bens que nos destes, o sacrifício puro, santo e imaculado, Pão santo da vida eterna e Cálice da perpétua salvação.
As: Aceitai, ó Senhor, a nossa oferta!

Pr: Suplicantes vos pedimos, ó Deus onipotente, que esta nossa oferenda seja levada à vossa presença, no altar do céu, pelas mãos do vosso santo anjo, para que todos nós, participando deste altar pela comunhão do santíssimo Corpo e Sangue do vosso Filho, sejamos repletos de todas as graças e bênçãos do céu.
As: O Espírito nos una num só corpo!

Pr: Lembrai-vos, ó Pai, dos vossos filhos e filhas (...) que nos precederam com o sinal da fé e dormem o sono da paz. A eles, e a todos os que descansam no Cristo, concedei o repouso, a luz e a paz.
As: Concedei-lhes, ó Senhor, a luz eterna!

Pr: A todos nós, pecadores, que esperamos na vossa infinita misericórdia, concedei o convívio dos apóstolos e mártires. Por Cristo, com Cristo e em Cristo, a vós, Deus Pai todo-poderoso, na unidade do Espírito Santo, toda honra e toda glória, por todos os séculos dos séculos.
As: Amém!`,
    },
    {
      title: 'Oração Eucarística II (Missal, p. 536)',
      content: `Pr: Na verdade, é digno e justo, é nosso dever e salvação dar-vos graças sempre e em todo lugar, Senhor, Pai santo, por vosso amado Filho, Jesus Cristo. Ele é a vossa Palavra, pela qual tudo criastes. Ele é o nosso Salvador e Redentor, que se encarnou pelo Espírito Santo e nasceu da Virgem Maria. Ele, para cumprir a vossa vontade e adquirir para vós um povo santo, estendeu os braços na hora da sua paixão, a fim de vencer a morte e manifestar a ressurreição. Por isso, com os anjos e todos os santos, proclamamos vossa glória, cantando (dizendo) a uma só voz:
As: Santo, Santo, Santo...

Pr: Na verdade, ó Pai, vós sois Santo, fonte de toda santidade. Santificai, pois, estes dons, derramando sobre eles o vosso Espírito, a fim de que se tornem para nós o Corpo e Sangue de nosso Senhor Jesus Cristo.
As: Enviai o vosso Espírito Santo!

Pr (Consagração — Corpo):
Estando para ser entregue e abraçando livremente a paixão, Jesus tomou o pão, pronunciou a bênção de ação de graças, partiu e o deu a seus discípulos, dizendo:
TOMAI, TODOS, E COMEI: ISTO É O MEU CORPO, QUE SERÁ ENTREGUE POR VÓS.

Pr (Consagração — Sangue):
Do mesmo modo, no fim da Ceia, ele tomou o cálice em suas mãos e, dando graças novamente, o entregou a seus discípulos, dizendo:
TOMAI, TODOS, E BEBEI: ESTE É O CÁLICE DO MEU SANGUE, O SANGUE DA NOVA E ETERNA ALIANÇA, QUE SERÁ DERRAMADO POR VÓS E POR TODOS PARA REMISSÃO DOS PECADOS. FAZEI ISTO EM MEMÓRIA DE MIM.

OP01 — As: Anunciamos, Senhor, a vossa morte e proclamamos a vossa ressurreição. Vinde, Senhor Jesus!
OP02 — As: Todas as vezes que comemos deste pão e bebemos deste cálice, anunciamos, Senhor, a vossa morte, enquanto esperamos a vossa vinda!
OP03 — As: Salvador do mundo, salvai-nos, vós que nos libertastes pela cruz e ressurreição!

Pr: Celebrando, pois, o memorial da morte e ressurreição do vosso Filho, nós vos oferecemos, ó Pai, o Pão da vida e o Cálice da salvação; e vos agradecemos porque nos tornastes dignos de estar aqui na vossa presença e vos servir.
As: Aceitai, ó Senhor, a nossa oferta!

Pr: Suplicantes vos pedimos que, participando do Corpo e Sangue de Cristo, sejamos reunidos pelo Espírito Santo num só corpo.
As: O Espírito nos una num só corpo!

Pr: Lembrai-vos, ó Pai, da vossa Igreja que se faz presente pelo mundo inteiro; que ela cresça na caridade, em comunhão com o papa (...), com o nosso bispo (...), os bispos do mundo inteiro, os presbíteros, os diáconos e todos os ministros do vosso povo.
As: Lembrai-vos, ó Pai, da vossa Igreja!

Pr (Defuntos): Lembrai-vos do vosso filho (da vossa filha) N., que (hoje) chamastes deste mundo à vossa presença. Tendo sido sepultado(a) com Cristo em sua morte, no batismo, participe igualmente da sua ressurreição.
Pr: Enfim, nós vos pedimos, tende piedade de todos nós e dai-nos participar da vida eterna, com a Virgem Maria, Mãe de Deus, São José, seu esposo, os apóstolos e todos os santos que neste mundo viveram na vossa amizade, a fim de vos louvarmos e glorificarmos por Jesus Cristo, vosso Filho. Por Cristo, com Cristo e em Cristo, a vós, Deus Pai todo-poderoso, na unidade do Espírito Santo, toda honra e toda glória, por todos os séculos dos séculos.
As: Amém!`,
    },
    {
      title: 'Oração Eucarística III (Missal, p. 545)',
      content: `Pr: Na verdade, vós sois Santo, ó Deus do universo, e tudo o que criastes proclama o vosso louvor, porque, por Jesus Cristo, vosso Filho e Senhor nosso, e pela força do Espírito Santo, dais vida e santidade a todas as coisas e não cessais de reunir para vós um povo que vos ofereça em toda parte, do nascer ao pôr do sol, um sacrifício perfeito.

Pr: Por isso, ó Pai, nós vos suplicamos: santificai pelo Espírito Santo as oferendas que vos apresentamos para serem consagradas, a fim de que se tornem o Corpo e o Sangue de vosso Filho, nosso Senhor Jesus Cristo, que nos mandou celebrar estes mistérios.
As: Enviai o vosso Espírito Santo!

Pr (Consagração — Corpo):
Na noite em que ia ser entregue, Jesus tomou o pão, pronunciou a bênção de ação de graças, partiu e o deu a seus discípulos, dizendo:
TOMAI, TODOS, E COMEI: ISTO É O MEU CORPO, QUE SERÁ ENTREGUE POR VÓS.

Pr (Consagração — Sangue):
Do mesmo modo, no fim da Ceia, ele tomou o cálice em suas mãos, pronunciou a bênção de ação de graças e o deu a seus discípulos, dizendo:
TOMAI, TODOS, E BEBEI: ESTE É O CÁLICE DO MEU SANGUE, O SANGUE DA NOVA E ETERNA ALIANÇA, QUE SERÁ DERRAMADO POR VÓS E POR TODOS PARA REMISSÃO DOS PECADOS. FAZEI ISTO EM MEMÓRIA DE MIM.

OP01 — As: Anunciamos, Senhor, a vossa morte e proclamamos a vossa ressurreição. Vinde, Senhor Jesus!
OP02 — As: Todas as vezes que comemos deste pão e bebemos deste cálice, anunciamos, Senhor, a vossa morte, enquanto esperamos a vossa vinda!
OP03 — As: Salvador do mundo, salvai-nos, vós que nos libertastes pela cruz e ressurreição!

Pr: Celebrando agora, ó Pai, o memorial da paixão redentora do vosso Filho, da sua gloriosa ressurreição e ascensão ao céu, e enquanto esperamos sua nova vinda, nós vos oferecemos em ação de graças este sacrifício vivo e santo.
As: Aceitai, ó Senhor, a nossa oferta!

Pr: Olhai com bondade a oblação da vossa Igreja e reconhecei nela o sacrifício que nos reconciliou convosco; concedei que, alimentando-nos com o Corpo e o Sangue do vosso Filho, repletos do Espírito Santo, nos tornemos em Cristo um só corpo e um só espírito.
As: O Espírito nos una num só corpo!

Pr: Que o mesmo Espírito faça de nós uma eterna oferenda para alcançarmos a herança com os vossos eleitos.
As: Fazei de nós uma perfeita oferenda!

Pr: Nós vos suplicamos, Senhor, que este sacrifício da nossa reconciliação estenda a paz e a salvação ao mundo inteiro. Confirmai na fé e na caridade a vossa Igreja que caminha neste mundo com o vosso servo o papa (...) e o nosso bispo (...), com os bispos do mundo inteiro, os presbíteros e diáconos.
As: Lembrai-vos, ó Pai, da vossa Igreja!

Pr: Acolhei com bondade no vosso Reino os nossos irmãos e irmãs que partiram desta vida e todos os que morreram na vossa amizade. Unidos a eles, esperamos também nós saciar-nos eternamente da vossa glória, por Cristo, Senhor nosso. Por Cristo, com Cristo e em Cristo, a vós, Deus Pai todo-poderoso, na unidade do Espírito Santo, toda honra e toda glória, por todos os séculos dos séculos.
As: Amém!`,
    },
    {
      title: '11. Rito da Comunhão',
      content: `OP01 — Pr: Obedientes à Palavra do Salvador e formados por seu divino ensinamento, ousamos dizer:
OP02 — Pr: Guiados pelo Espírito Santo, que ora em nós e por nós, elevemos as mãos ao Pai e rezemos juntos a oração que o próprio Jesus nos ensinou:
As: Pai nosso que estais nos céus...

Pr: Livrai-nos de todos os males, ó Pai, e dai-nos hoje a vossa paz. Ajudados pela vossa misericórdia, sejamos sempre livres do pecado e protegidos de todos os perigos, enquanto aguardamos a feliz esperança e a vinda do nosso Salvador, Jesus Cristo.
As: Vosso é o Reino, o poder e a glória para sempre!

Pr: Senhor Jesus Cristo, dissestes aos vossos apóstolos: "Eu vos deixo a paz, eu vos dou a minha paz". Não olheis os nossos pecados, mas a fé que anima vossa Igreja; dai-lhe, segundo o vosso desejo, a paz e a unidade.
As: Amém!

Pr: A paz do Senhor esteja sempre convosco.
As: O amor de Cristo nos uniu!

OP01 — Pr: Irmãos e irmãs, saudai-vos em Cristo Jesus.
OP02 — No Espírito de Cristo ressuscitado, saudai-vos com um sinal de paz.

As: Cordeiro de Deus, que tirais o pecado do mundo, tende piedade de nós. (2×)
    Cordeiro de Deus, que tirais o pecado do mundo, dai-nos a paz.

Pr: Senhor Jesus Cristo, o vosso Corpo e o vosso Sangue, que vou receber, não se tornem causa de juízo e condenação; mas, por vossa bondade, sejam proteção e remédio para minha vida.

OP01 — Pr: Felizes os convidados para a Ceia do Senhor. Eis o Cordeiro de Deus, que tira o pecado do mundo!
OP02 — Pr: Eu sou o Pão vivo, que desceu do céu: se alguém come deste Pão, viverá eternamente. Eis o Cordeiro de Deus, que tira o pecado do mundo!
As: Senhor, eu não sou digno(a) de que entreis em minha morada, mas dizei uma palavra e serei salvo(a).

Pr: O Corpo de Cristo me guarde para a vida eterna.
    O Sangue de Cristo me guarde para a vida eterna.

APÓS A COMUNHÃO, O PADRE REZA:
Fazei, Senhor, que conservemos num coração puro o que a nossa boca recebeu. E que esta dádiva temporal se transforme para nós em remédio eterno.

12 — DEPOIS DA COMUNHÃO (própria do dia)`,
    },
    {
      title: 'RITOS FINAIS — 13. Bênção Final',
      content: `OP01 — Pr: O Senhor esteja convosco.
As: Ele está no meio de nós!
Pr: Abençoe-vos Deus todo-poderoso, Pai e Filho e Espírito Santo.
As: Amém!
Pr: Ide em paz, e o Senhor vos acompanhe.
As: Graças a Deus!

(Vigília Pascal e Oitava da Páscoa)
OP02 — Pr: Deus todo-poderoso vos abençoe nesta solenidade pascal e vos proteja contra todo pecado.
As: Amém!
Pr: Aquele que vos renova para a vida eterna, pela ressurreição do seu Filho vos enriqueça com o dom da imortalidade.
As: Amém!
Pr: E vós, que, transcorridos os dias da paixão do Senhor, celebrais com júbilo a festa da Páscoa, possais chegar, pela graça de Deus, com o coração exultante, à festa das alegrias eternas.
As: Amém!
Pr: E a bênção de Deus todo-poderoso, Pai e Filho e Espírito Santo, desça sobre vós e permaneça para sempre.
As: Amém!
Pr: Ide em paz, e o Senhor vos acompanhe, aleluia, aleluia.
As: Graças a Deus, aleluia, aleluia!

(TEMPO PASCAL)
OP03 — Pr: Deus, que, pela ressurreição do seu Filho único, vos deu a graça da redenção e vos tornou seus filhos, vos conceda a alegria de sua bênção.
As: Amém!
Pr: Deus, que, pela redenção de Cristo, vos concedeu o dom da verdadeira liberdade, por sua misericórdia vos torne participantes da herança eterna.
As: Amém!
Pr: E, vivendo agora retamente, possais no céu unir-vos a Deus, para o qual, pela fé, já ressuscitastes no batismo.
As: Amém!
Pr: E a bênção de Deus todo-poderoso, Pai e Filho e Espírito Santo, desça sobre vós e permaneça para sempre.
As: Amém!
Pr: Ide em paz, e o Senhor vos acompanhe.
As: Graças a Deus!`,
    },
  ],
},

// ── 2. VISITA E COMUNHÃO AOS DOENTES E IDOSOS ───────────────────────────────
{
  id: 'doentes',
  title: 'Visita e Comunhão aos Doentes e Idosos',
  icon: '🕊️',
  sections: [
    {
      title: 'Orientação Inicial',
      content: `Se possível, providenciar que a família do doente ou do idoso esteja presente e participe da celebração.`,
    },
    {
      title: '1. Saudação Inicial',
      content: `MESC: Em nome do Pai e do Filho e do Espírito Santo.
TODOS: Amém.
MESC: A paz do Senhor esteja sempre nesta casa.
TODOS: E com todos os que nela moram.`,
    },
    {
      title: '2. Momento Penitencial',
      content: `MESC: Reconheçamos que necessitamos do amor e da misericórdia de Deus para bem celebrar este momento. Por isso, peçamos perdão. Tende compaixão de nós, Senhor.
TODOS: Porque somos pecadores.
MESC: Manifestai, Senhor, a vossa misericórdia.
TODOS: E dai-nos vossa salvação.
MESC: Senhor, Deus da vida e do amor, perdoe nossas ofensas e nos dê a paz.
TODOS: Amém.`,
    },
    {
      title: '3. Oração',
      content: `MESC: Manifestai, Senhor nosso Deus, vossa bondade para com este/a vosso/a filho/a (...), concedendo-lhe a graça da saúde e da paz, para que vos sirva com alegria e generosidade e a todos edifique com seu testemunho de fé. Por Cristo, nosso Senhor.
TODOS: Amém.`,
    },
    {
      title: '4. Palavra de Deus',
      content: `Proclamar o Evangelho do dia ou o seguinte (Jo 6,54-56):
"Quem come a minha carne e bebe o meu sangue tem a vida eterna, e eu o ressuscitarei no último dia. Pois a minha carne é verdadeiro alimento e o meu sangue é verdadeira bebida. Quem come a minha carne e bebe o meu sangue permanece em mim e eu nele."

Pode haver breve reflexão sobre a Palavra proclamada.`,
    },
    {
      title: '5. Pai-Nosso e Comunhão',
      content: `O ministro motiva a oração do Pai Nosso e todos rezam. Em seguida, erguendo a hóstia consagrada, diz:
MESC: Somos felizes porque podemos comungar o Corpo do Senhor. Eis o Cordeiro...
TODOS: Senhor, eu não sou digno/a...
MESC: O Corpo de Cristo.
Pode haver breve silêncio após a comunhão.`,
    },
    {
      title: '6. Oração de Ação de Graças',
      content: `MESC: Ó Deus, que este alimento sagrado fortifique e conserve na paz vosso/a filho/a (...). Fazei que ele/a persevere na sinceridade de vosso amor e de vossa misericórdia. Por Cristo, nosso Senhor.
TODOS: Amém.`,
    },
    {
      title: '7. Bênção Final',
      content: `MESC: Deus Pai nos abençoe e nos guarde.
TODOS: Amém.
MESC: Deus Filho nos conceda a saúde.
TODOS: Amém.
MESC: Deus Espírito Santo nos ilumine.
TODOS: Amém.
MESC: Em nome do Pai e do Filho e do Espírito Santo.
TODOS: Amém.
MESC: Permaneçamos firmes na fé e na paz do Senhor.
TODOS: Agora e sempre. Amém.`,
    },
  ],
},

// ── 3. CELEBRAÇÃO DE EXÉQUIAS ────────────────────────────────────────────────
{
  id: 'exequias',
  title: 'Celebração de Exéquias',
  icon: '🕯️',
  sections: [
    {
      title: '1. Ritos Iniciais',
      content: `Pode se entoar o refrão "Quem nos separará".

Min: O Senhor da vida console nossa tristeza e confirme nossa esperança de nos encontrarmos todos, um dia, na pátria celeste. Iniciemos a celebração com o sinal da nossa fé: em nome do Pai e do Filho e do Espírito Santo.
TODOS: Amém.

Min: Ó Pai, vós que sois justo, sede misericordioso com este/a nosso/a irmão/ã (...), que chamastes deste mundo. Acolhei-o/a na alegria eterna. Criado/a à vossa imagem e semelhança e adotado/a por vós como filho/a pelo batismo, participe da comunhão de vossos santos. Por Cristo, nosso Senhor.
TODOS: Amém.`,
    },
    {
      title: '2. Palavra de Deus',
      content: `Pode-se entoar breve refrão à Palavra de Deus.

EVANGELHO (João 6,37-39)
Proclamação do Evangelho de Jesus Cristo segundo João:
"Todos aqueles que o Pai me dá virão a mim, e aqueles que vêm a mim não os rejeitarei, porque desci do céu não para fazer a minha vontade, mas a vontade daquele que me enviou. E a vontade daquele que me enviou é esta: que eu não perca nenhum dos que ele me deu, mas os ressuscite no último dia."
— Palavra da Salvação.
TODOS: Glória a vós, Senhor!

Pode haver breve reflexão e preces dos fiéis.`,
    },
    {
      title: '3. Encomendação',
      content: `Min: Com fé e esperança na vida eterna, recomendemos ao Pai do céu este/a nosso/a irmão/ã (...), que morreu na paz de Cristo. O Pai de misericórdia, em vossas mãos o/a entregamos na firme esperança de que ele/a ressuscitará no último dia com todos os que em Cristo adormeceram. Abri para ele/a as portas do paraíso, e a nós, que aqui ficamos, consolai-nos com a certeza de que um dia nos encontraremos todos em vossa casa. Por Cristo, nosso Senhor.
TODOS: Amém.

Enquanto o corpo é aspergido, pode-se rezar o Pai Nosso. A seguir, o ministro continua...

Min: Santos de Deus, vinde em seu auxílio; anjos do Senhor, recebei na glória eterna este/a vosso/a servidor/a (...). Cristo, nosso Senhor, te chamou; ele te acolha no paraíso para o descanso eterno.
TODOS: Amém.

Min: Dai-lhe, Senhor, o repouso eterno.
TODOS: E brilhe para ele/a vossa luz.
Min: Descanse em paz.
TODOS: Amém.

(Canto)
Enquanto as pessoas se despedem do morto, a assembleia pode cantar o Sl 23 ou outro canto apropriado. Pode-se concluir com a oração da Salve-Rainha.`,
    },
    {
      title: '4. Sepultamento ou Cremação',
      content: `O ministro reza a seguinte oração:
Min: Ó Pai de bondade, vossos dias não conhecem fim e vossa misericórdia não tem limites. Lembrando a brevidade de nossa vida e a incerteza da hora da morte, nós vos pedimos que vosso Espírito Santo nos conduza neste mundo na santidade e na justiça. E, depois de vos servirmos na terra, possamos chegar ao vosso Reino no céu. Por Cristo, nosso Senhor.
TODOS: Amém.

Concluir com canto apropriado.`,
    },
  ],
},

// ── 4. CELEBRAÇÃO DA PALAVRA ─────────────────────────────────────────────────
{
  id: 'palavra',
  title: 'Celebração da Palavra',
  icon: '📖',
  sections: [
    {
      title: '1. Saudação',
      content: `M — Em nome do Pai...
T — Amém.

O Ministro poderá falar da alegria e da importância de estarem reunidos para cultuar a Deus, terminando com estas ou outras palavras semelhantes:
FAZER A ORAÇÃO DO DIA / LITURGIA DIÁRIA

M — A Misericórdia do Pai, o amor do Filho e a comunhão do Espírito Santo, estejam conosco.
T — Amém.`,
    },
    {
      title: '2. Rito Penitencial',
      content: `Quem preside motiva a assembleia ao pedido de perdão. Após, rezar o Confesso a Deus ou entoar um canto apropriado.

M — Meus irmãos, reconheçamos as nossas faltas e peçamos perdão a Deus para recebermos dignamente a Comunhão no Corpo do Senhor.
T — Confesso a Deus todo poderoso e a vós irmãos e irmãs, que pequei muitas vezes por pensamentos e palavras, atos e omissões, por minha culpa, minha tão grande culpa. E Peço a Virgem Maria, aos Anjos e Santos, e a vós irmãos e irmãs, que rogueis por mim a Deus, nosso Senhor.
M — Deus todo poderoso tenha compaixão de nós, perdoe os nossos pecados e nos conduza à vida eterna.
T — Amém.`,
    },
    {
      title: '3. Liturgia da Palavra',
      content: `1ª Leitura, Salmo, 2ª Leitura (quando houver)...

EVANGELHO:
M — O Senhor esteja conosco.
T — Ele está no meio de nós.
M — Proclamação do Evangelho de Jesus Cristo Segundo...
T — Glória a Vós Senhor.
M — Palavra da Salvação.
T — Glória a Vós Senhor.`,
    },
    {
      title: '4. Homilia — 5. Profissão de Fé',
      content: `4 — HOMILIA.

5 — CREIO (Profissão de Fé)
Após essa reflexão que possamos juntos renovar a nossa Fé rezando...
CREIO EM DEUS PAI TODO PODEROSO, criador do céu e da terra, e em Jesus Cristo, seu único Filho, nosso Senhor, que foi concebido pelo poder do Espírito Santo; nasceu da Virgem Maria; padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; desceu à mansão dos mortos; ressuscitou ao terceiro dia; subiu aos céus; está sentado à direita de Deus Pai todo-poderoso, donde há de vir a julgar os vivos e os mortos. Creio no Espírito Santo, na santa Igreja católica, na comunhão dos santos, na remissão dos pecados, na ressurreição da carne, na vida eterna. Amém.`,
    },
    {
      title: '6. Rito da Comunhão',
      content: `Trazer Âmbula com Reserva Eucarística e colocar sobre o Altar ainda fechada.

M — Antes de participar da Eucaristia, sinal de reconciliação e vínculo de união fraterna, rezemos juntos como o Senhor nos ensinou:
T — Pai Nosso que estais nos céus...

M — Senhor, livrai-nos do mal e dai-nos a graça de sempre mais vos amar e de amar também nossos irmãos. Fazei, Senhor, que o vosso Corpo que vamos receber com fé, nos fortaleça, a fim de cumprirmos em tudo a vossa vontade e permaneçamos sempre unidos a vós e aos vossos irmãos.

Tirar o Conopel da Âmbula e abri-la. Fazer Genuflexão. Fazer breve Adoração. Pegar uma hóstia nas mãos e mostrar aos irmãos.
M — Felizes os convidados para a Ceia do Senhor! Eis O Cordeiro de Deus, que tira o pecado do mundo.
T — Senhor, eu não sou digno de que entreis em minha morada, mas dizei uma palavra e serei salvo.
M — O Corpo do Senhor Jesus Cristo me guarde para a vida eterna.`,
    },
    {
      title: '7. Ação de Graças',
      content: `Pode-se guardar, durante algum tempo, um sagrado silêncio ou algum canto de louvor. A seguir o ministro conclui, com a seguinte oração.

M — Oremos: Senhor Jesus Cristo, neste admirável sacramento, nos deixastes o memorial da vossa paixão. Dai-nos venerar com tão grande amor o mistério do vosso Corpo e do vosso Sangue, que possamos continuamente colher os frutos da vossa redenção. Vós que reinais com o Pai, na unidade do Espírito Santo.
T — Amém!`,
    },
    {
      title: '8. Bênção Final — 9. Antífona Mariana',
      content: `8 — BÊNÇÃO FINAL
M — Que o Senhor todo-poderoso e cheio de misericórdia, Pai, e Filho, e Espírito Santo, nos abençoe e nos guarde agora e sempre.
Vamos em Paz e que o Senhor nos acompanhe.
T — Amém!

9 — ANTÍFONA MARIANA
T — Dai-nos a benção ó Virgem Maria, Luz para a noite e paz para o Dia.
Santo Anjo do Senhor, meu Zeloso guardador,
se a Ti me confiou a piedade Divina,
Sempre me rege, me guarde, me governe e me ilumine.
Amém.`,
    },
  ],
},

];

// ── Componente RitosLiturgicosTab ─────────────────────────────────────────────
function RitosLiturgicosTab() {
  const [openSubgroup, setOpenSubgroup] = React.useState<string | null>(null);
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({});

  const toggleSubgroup = (id: string) => {
    setOpenSubgroup(prev => prev === id ? null : id);
  };

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const expandAll = (subgroupId: string, sections: RitoSection[]) => {
    const keys: Record<string, boolean> = {};
    sections.forEach((_, i) => { keys[`${subgroupId}-${i}`] = true; });
    setOpenSections(prev => ({ ...prev, ...keys }));
  };

  const collapseAll = (subgroupId: string, sections: RitoSection[]) => {
    const keys: Record<string, boolean> = {};
    sections.forEach((_, i) => { keys[`${subgroupId}-${i}`] = false; });
    setOpenSections(prev => ({ ...prev, ...keys }));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#1A1A1A]/50 italic">
        Ritos litúrgicos oficiais da Igreja Católica. Selecione um subgrupo para ver o conteúdo completo.
      </p>

      {ritosData.map((subgroup) => {
        const isOpen = openSubgroup === subgroup.id;
        const anyOpen = subgroup.sections.some((_, i) => openSections[`${subgroup.id}-${i}`]);

        return (
          <div key={subgroup.id} className="bg-white rounded-[2rem] border border-[#1A1A1A]/5 overflow-hidden">
            {/* Cabeçalho do subgrupo */}
            <button
              onClick={() => toggleSubgroup(subgroup.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-[#F5F2ED] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{subgroup.icon}</span>
                <div>
                  <p className="font-bold text-base">{subgroup.title}</p>
                  <p className="text-xs text-[#1A1A1A]/40 mt-0.5">{subgroup.sections.length} seções</p>
                </div>
              </div>
              {isOpen
                ? <ChevronUp className="w-5 h-5 text-[#5A5A40] flex-shrink-0" />
                : <ChevronDown className="w-5 h-5 text-[#1A1A1A]/30 flex-shrink-0" />}
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-2 border-t border-[#1A1A1A]/5 pt-4">
                    {/* Botões Expandir/Recolher todos */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => expandAll(subgroup.id, subgroup.sections)}
                        className="text-[11px] font-bold text-[#5A5A40] px-3 py-1.5 bg-[#5A5A40]/10 rounded-xl hover:bg-[#5A5A40]/20 transition-colors"
                      >
                        Expandir tudo
                      </button>
                      <button
                        onClick={() => collapseAll(subgroup.id, subgroup.sections)}
                        className="text-[11px] font-bold text-[#1A1A1A]/40 px-3 py-1.5 bg-[#F5F2ED] rounded-xl hover:bg-[#1A1A1A]/10 transition-colors"
                      >
                        Recolher tudo
                      </button>
                    </div>

                    {/* Seções accordion */}
                    {subgroup.sections.map((section, idx) => {
                      const sectionKey = `${subgroup.id}-${idx}`;
                      const isSectionOpen = !!openSections[sectionKey];

                      return (
                        <div key={idx} className="rounded-2xl border border-[#1A1A1A]/5 overflow-hidden bg-[#F5F2ED]/50">
                          <button
                            onClick={() => toggleSection(sectionKey)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F5F2ED] transition-colors"
                          >
                            <span className="font-semibold text-sm pr-2">{section.title}</span>
                            {isSectionOpen
                              ? <ChevronUp className="w-4 h-4 text-[#5A5A40] flex-shrink-0" />
                              : <ChevronDown className="w-4 h-4 text-[#1A1A1A]/30 flex-shrink-0" />}
                          </button>

                          <AnimatePresence>
                            {isSectionOpen && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-5 pt-1 border-t border-[#1A1A1A]/5">
                                  <pre className="whitespace-pre-wrap text-sm text-[#1A1A1A]/80 font-serif leading-relaxed">
                                    {section.content}
                                  </pre>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────
export default function Prayers() {
  const [sub, setSub] = useState<SubTab>('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<PrayerCategory>('habituais');
  const [isSaving, setIsSaving] = useState(false);
  const [userPrayers, setUserPrayers] = useState<UserPrayerItem[]>([]);

  // Carrega as orações do usuário do servidor ao montar.
  // mergeServerData protege contra cold start: se servidor retornar vazio
  // mas o cache local tiver dados, os dados do cache são mantidos.
  useEffect(() => {
    apiLoadUserPrayers().then(prayers => {
      const finalPrayers = mergeServerData<UserPrayerItem[]>('user_prayers', prayers, false);
      setUserPrayers(finalPrayers);

      // Re-sincroniza orações com ID temporário (negativo) que não chegaram ao servidor.
      // Isso ocorre quando o servidor estava fora durante o salvamento.
      const unsaved = finalPrayers.filter(p => p.id < 0);
      if (unsaved.length > 0) {
        unsaved.forEach(p => {
          apiSaveUserPrayer(p.title, p.text, p.category)
            .then(newId => {
              if (newId !== null) {
                // Atualiza o ID temporário pelo ID real do servidor.
                // O key do componente não muda porque usa title+category (estável).
                setUserPrayers(prev => {
                  const updated = prev.map(x =>
                    x.id === p.id ? { ...x, id: newId } : x
                  );
                  cacheSet<UserPrayerItem[]>('user_prayers', updated);
                  return updated;
                });
              }
            })
            .catch(() => {}); // silencioso — oração continua no cache
        });
      }
    }).catch(() => {
      // Erro de rede → usa cache
      const cached = cacheGet<UserPrayerItem[]>('user_prayers', []);
      setUserPrayers(cached);
    });
  }, []);

  // Salva oração: espera a resposta do servidor antes de fechar o modal.
  // Isso garante que o ID final (real ou temporário) é definido UMA única vez,
  // sem atualização posterior que mudaria o key e causaria o bug de colapso.
  const saveUserPrayer = async () => {
    if (!newTitle.trim() || !newText.trim()) return;
    setIsSaving(true);

    const title = newTitle.trim();
    const text = newText.trim();
    const category = newCategory;

    // Tenta salvar no servidor (aguarda resposta)
    const serverId = await apiSaveUserPrayer(title, text, category);

    // Usa o ID do servidor se disponível; caso contrário, ID temporário local (negativo)
    const finalId = serverId !== null ? serverId : -(Date.now());

    const newPrayer: UserPrayerItem = { id: finalId, title, text, category };
    const updated = [...userPrayers, newPrayer].sort((a, b) =>
      a.title.localeCompare(b.title, 'pt')
    );

    // Atualiza estado e cache em uma única operação — sem atualização posterior
    setUserPrayers(updated);
    cacheSet<UserPrayerItem[]>('user_prayers', updated);

    setIsSaving(false);
    setNewTitle(''); setNewText(''); setNewCategory('habituais'); setShowAddModal(false);
  };

  const deleteUserPrayer = async (id: number) => {
    const updated = userPrayers.filter(p => p.id !== id);
    setUserPrayers(updated);
    cacheSet<UserPrayerItem[]>('user_prayers', updated);
    await apiDeleteUserPrayer(id);
  };

  const tabs = [
    { id: 'daily' as SubTab, label: 'Orações Cotidianas', icon: <Heart className="w-4 h-4" /> },
    { id: 'adoration' as SubTab, label: 'Adoração Eucarística', icon: <Star className="w-4 h-4" /> },
    { id: 'consecration' as SubTab, label: 'Consagração a Jesus Cristo', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'ritos' as SubTab, label: 'Ritos Litúrgicos', icon: <BookMarked className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">Orações</h2>
        <p className="text-[#1A1A1A]/60 italic">"Orai sem cessar." — 1Ts 5,17</p>
      </header>

      {/* Abas + Botão Adicionar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-[#1A1A1A]/5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setSub(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${sub === t.id ? 'bg-[#5A5A40] text-white shadow-md' : 'text-[#1A1A1A]/50 hover:text-[#5A5A40]'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {sub === 'daily' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#5A5A40] text-white rounded-2xl text-xs font-bold hover:scale-105 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> Adicionar Oração
          </button>
        )}
      </div>

      {/* Campo de busca (só na aba Cotidianas) */}
      {sub === 'daily' && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/30" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por título ou trecho da oração..."
            className="w-full pl-11 pr-10 py-3.5 bg-white border border-[#1A1A1A]/8 rounded-2xl text-sm focus:ring-2 focus:ring-[#5A5A40]/30 focus:outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={sub} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {sub === 'daily' && (
            <DailyPrayers
              searchTerm={searchTerm}
              userPrayers={userPrayers}
              onDeleteUserPrayer={deleteUserPrayer}
            />
          )}
          {sub === 'adoration' && <AdorationModelsTab />}
          {sub === 'consecration' && <ConsecrationTab />}
          {sub === 'ritos' && <RitosLiturgicosTab />}
        </motion.div>
      </AnimatePresence>

      {/* Modal Adicionar Oração */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Nova Oração</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-[#F5F2ED] rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-1 block">Categoria</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 'habituais', label: 'Orações Habituais' },
                      { value: 'ladainhas', label: 'Ladainhas' },
                      { value: 'formais',   label: 'Orações Formais' },
                    ] as { value: PrayerCategory; label: string }[]).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewCategory(opt.value)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center ${newCategory === opt.value ? 'bg-[#5A5A40] text-white shadow-md' : 'bg-[#F5F2ED] text-[#1A1A1A]/50 hover:bg-[#5A5A40]/10 hover:text-[#5A5A40]'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-1 block">Título da Oração</label>
                  <input
                    type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ex: Oração pela família..."
                    className="w-full px-4 py-3 bg-[#F5F2ED] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]/30 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-1 block">Texto da Oração</label>
                  <textarea
                    value={newText} onChange={e => setNewText(e.target.value)}
                    placeholder="Digite o texto da oração aqui..."
                    rows={7}
                    className="w-full px-4 py-3 bg-[#F5F2ED] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]/30 text-sm resize-none font-serif"
                  />
                </div>
                <button
                  onClick={saveUserPrayer}
                  disabled={!newTitle.trim() || !newText.trim() || isSaving}
                  className="w-full py-3.5 bg-[#5A5A40] text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:scale-[1.02] transition-all"
                >
                  <Save className="w-4 h-4" /> {isSaving ? 'Salvando...' : 'Salvar Oração'}
                </button>
                <p className="text-[10px] text-center text-[#1A1A1A]/30">Orações adicionadas ficam salvas na sua conta.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
