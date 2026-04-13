import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Heart, Star, Search, Plus, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type SubTab = 'daily' | 'adoration' | 'consecration';
interface PrayerItem { title: string; text: string; }

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
  { title: 'Sub Tua Praesidium (Português)', text: 'Sob a vossa proteção nos acolhemos,\nSanta Mãe de Deus.\nNão desprezeis as nossas súplicas\nnas nossas necessidades,\nmas livrai-nos sempre de todos os perigos,\nó Virgem gloriosa e bendita.' },
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
  { title: 'Oração de Renúncia', text: 'Senhor Jesus Cristo,\nem vosso Santo Nome e pelo poder da vossa Cruz,\nrenuncio a toda influência do mal,\na toda obra das trevas,\na todo pecado passado e presente.\nRenuncio ao demônio e a todas as suas obras.\nConságro-me a vós completamente.\nSejais meu Senhor e meu Deus agora e sempre.\nAmém.' },
];

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
  { week: 'Semana Preparatória (Dias 1–7)', theme: 'Morte a Si Mesmo — Conhecimento e Abandono do Pecado', color: 'gray',
    days: [
      { day:1, subtheme:'A escravidão do pecado', tratado:'Cap. 79–89', leitura:'Rm 6,15-23 — Escravos da justiça', oracoes:'Ave-Maria, Rosário (Dolorosos), Ladainha do Espírito Santo', exercicio:'Exame de consciência geral de vida' },
      { day:2, subtheme:'O mundo como inimigo da alma', tratado:'Cap. 90–100', leitura:'1Jo 2,15-17 — Não ameis o mundo', oracoes:'Ladainha de Nossa Senhora, Magnificat', exercicio:'Identificar 3 apegos mundanos e renunciá-los' },
      { day:3, subtheme:'O demônio e seus enganos', tratado:'Cap. 101–109', leitura:'1Pe 5,8-11 — Sede sóbrios e vigilantes', oracoes:'Oração a São Miguel, Rosário (Dolorosos)', exercicio:'Oração de renúncia ao demônio' },
      { day:4, subtheme:'A carne e suas inclinações desordenadas', tratado:'Cap. 79–82 (releitura)', leitura:'Gl 5,16-24 — Obras da carne e frutos do Espírito', oracoes:'Rosário (Dolorosos), Ato de Contrição', exercicio:'Prática de mortificação dos sentidos' },
      { day:5, subtheme:'Necessidade de Maria para superar o pecado', tratado:'Cap. 41–55', leitura:'Lc 1,46-55 — Magnificat', oracoes:'Salve Rainha, Ladainha de Nossa Senhora', exercicio:'Consagrar ao Imaculado Coração as raízes de pecado' },
      { day:6, subtheme:'A graça de Deus e a cooperação humana', tratado:'Cap. 56–59', leitura:'Fl 2,12-13 — Trabalhai pela vossa salvação', oracoes:'Te Deum, Rosário (Gloriosos)', exercicio:'Resolução de cooperação com a graça' },
      { day:7, subtheme:'Revisão e fortalecimento da decisão', tratado:'Cap. 60–67', leitura:'Mc 8,34-38 — Negar-se a si mesmo', oracoes:'Vésperas marianas, Ave-Maria (50 vezes)', exercicio:'Revisão dos 6 primeiros dias. Propósitos escritos.' },
    ] },
  { week: '1ª Semana (Dias 8–14)', theme: 'Conhecimento de Si Mesmo — Humildade Verdadeira', color: 'blue',
    days: [
      { day:8, subtheme:'O que somos sem Deus', tratado:'Cap. 213–221', leitura:'Is 64,5-6 — Como pano imundo', oracoes:'Rosário (Dolorosos), Ato de Fé, Ato de Esperança', exercicio:'Meditação sobre a própria miséria com gratidão' },
      { day:9, subtheme:'A falsidade do orgulho', tratado:'Cap. 222–226', leitura:'Lc 18,9-14 — O fariseu e o publicano', oracoes:'Ladainha dos Santos, Magnificat', exercicio:'Identificar uma área de orgulho e entregá-la a Maria' },
      { day:10, subtheme:'A humildade de Maria como modelo', tratado:'Cap. 260–265', leitura:'Lc 1,26-38 — A Anunciação', oracoes:'Rosário (Dolorosos), Ato de Humildade', exercicio:'Realizar uma tarefa humilde sem ser visto' },
      { day:11, subtheme:'Verdadeiro conhecimento de si', tratado:'Cap. 213–220', leitura:'Sl 139 (138) — Buscai-me e conhecei-me', oracoes:'Ladainha do Sagrado Coração, Rosário (Gloriosos)', exercicio:'Carta pessoal sobre quem sou diante de Deus' },
      { day:12, subtheme:'Abandonar o julgamento próprio', tratado:'Cap. 227–236', leitura:'Mt 18,1-4 — Tornai-vos como crianças', oracoes:'Rosário (Gozosos), Alma de Cristo', exercicio:'Ato concreto de deferência a outrem' },
      { day:13, subtheme:'Depender de Maria como criança', tratado:'Cap. 237–244', leitura:'Jo 19,26-27 — Eis a tua mãe', oracoes:'Consagração da família a Maria, Ladainha de Nossa Senhora', exercicio:'Colocar-se nas mãos de Maria por uma semana' },
      { day:14, subtheme:'Síntese: quem sou e para que fui criado', tratado:'Cap. 245–260', leitura:'Ef 1,3-14 — Bendito Deus que nos escolheu', oracoes:'Rosário completo, Te Deum', exercicio:'Renovação do batismo e da vocação' },
    ] },
  { week: '2ª Semana (Dias 15–21)', theme: 'Conhecimento de Nossa Senhora — Devoção Verdadeira', color: 'rose',
    days: [
      { day:15, subtheme:'Quem é Maria: sua grandeza e missão', tratado:'Cap. 1–16', leitura:'Gn 3,14-15 — Inimizade entre ela e a serpente', oracoes:'Rosário (Gozosos), Ladainha de Loreto', exercicio:'Pesquisar e meditar um título mariano' },
      { day:16, subtheme:'Maria, caminho seguro para Jesus', tratado:'Cap. 17–31', leitura:'Jo 2,1-11 — A intercessão de Maria em Caná', oracoes:'Salve Rainha, Memorare, Rosário (Luminosos)', exercicio:'Pedir a Maria que leve suas orações a Jesus hoje' },
      { day:17, subtheme:'A devoção verdadeira e os desvios', tratado:'Cap. 89–108', leitura:'Pv 8,17-35 — Amar a Sabedoria', oracoes:'Rosário (Dolorosos), Sub Tuum Praesidium', exercicio:'Examinar a qualidade da própria devoção a Maria' },
      { day:18, subtheme:'Maria, escrava de Deus — modelo de consagração', tratado:'Cap. 109–125', leitura:'Lc 1,38 — Eis a escrava do Senhor', oracoes:'Ladainha de Nossa Senhora, Magnificat', exercicio:'Meditar o que "escravidão de amor" significa' },
      { day:19, subtheme:'Os efeitos da devoção mariana verdadeira', tratado:'Cap. 126–147', leitura:'Jo 15,1-8 — Permanecei em mim', oracoes:'Rosário (Gloriosos), Ato de Amor a Maria', exercicio:'Renunciar a um hábito contrário ao amor a Maria' },
      { day:20, subtheme:'A consagração total: dar tudo a Maria', tratado:'Cap. 148–165', leitura:'Sl 45 (44) — Canto nupcial', oracoes:'Rosário (Gozosos), Ladainha dos Santos', exercicio:'Preparar a lista do que se quer consagrar' },
      { day:21, subtheme:'Maria como mestra de vida interior', tratado:'Cap. 166–180', leitura:'Lc 2,19 — Maria guardava no coração', oracoes:'Vésperas, Rosário completo, Consagração de São Luís', exercicio:'Imitar Maria em uma virtude hoje' },
    ] },
  { week: '3ª Semana (Dias 22–28)', theme: 'Conhecimento de Jesus Cristo — O Caminho, a Verdade e a Vida', color: 'green',
    days: [
      { day:22, subtheme:'Jesus Cristo, Filho de Deus Encarnado', tratado:'Cap. 243–248', leitura:'Jo 1,1-14 — No princípio era o Verbo', oracoes:'Credo Niceno, Rosário (Gozosos), Alma de Cristo', exercicio:'Meditação sobre o mistério da Encarnação' },
      { day:23, subtheme:'Viver com, por e em Jesus por Maria', tratado:'Cap. 257–265', leitura:'Gl 2,19-20 — Não sou eu que vivo, é Cristo', oracoes:'Rosário (Luminosos), Ato de Consagração a Jesus', exercicio:'Oferecer cada ação do dia com a intenção de Cristo' },
      { day:24, subtheme:'O batismo e a pertença a Cristo', tratado:'Cap. 126–130', leitura:'Rm 6,1-11 — Batizados para uma vida nova', oracoes:'Renovação das promessas batismais, Rosário (Dolorosos)', exercicio:'Reler os votos batismais e renovar interiormente' },
      { day:25, subtheme:'A Cruz como caminho de transformação', tratado:'Cap. 168–173', leitura:'1Cor 1,17-25 — A loucura da Cruz', oracoes:'Via-Sacra meditada, Rosário (Dolorosos)', exercicio:'Abraçar uma cruz do dia como participação em Cristo' },
      { day:26, subtheme:'Jesus Eucarístico, presença do Ressuscitado', tratado:'Cap. 214–221', leitura:'Jo 6,53-58 — Quem come a minha carne...', oracoes:'Adoração breve ao Santíssimo, Rosário (Gloriosos)', exercicio:'Visita ao Santíssimo ou oração de adoração espiritual' },
      { day:27, subtheme:'O Espírito Santo e Maria no serviço a Cristo', tratado:'Cap. 35–41', leitura:'At 1,12-14 — Perseverantes em oração com Maria', oracoes:'Veni Creator, Ladainha do Espírito Santo', exercicio:'Invocar o Espírito Santo antes de cada atividade' },
      { day:28, subtheme:'O reinado de Cristo pelo serviço de Maria', tratado:'Cap. 55–60', leitura:'Fl 2,5-11 — Cristo humilhou-se... Deus o exaltou', oracoes:'Rosário completo, Te Deum', exercicio:'Oferecer o dia pelo reinado de Cristo' },
    ] },
  { week: 'Semana Final (Dias 29–33)', theme: 'Unificação e Preparação para a Consagração', color: 'gold',
    days: [
      { day:29, subtheme:'Recapitulação: morte, humildade, Maria, Cristo', tratado:'Cap. 265–273', leitura:'Cl 3,1-4 — Pensai nas coisas do alto', oracoes:'Rosário completo, Ladainha de Nossa Senhora', exercicio:'Redigir a carta de consagração pessoal' },
      { day:30, subtheme:'A liberdade dos filhos de Deus em Maria', tratado:'Cap. 169–174', leitura:'Gl 4,4-7 — Deus enviou seu Filho, nascido de mulher', oracoes:'Magnificat, Rosário (Gozosos), Memorare', exercicio:'Identificar um ponto de liberdade espiritual alcançado' },
      { day:31, subtheme:'Perseverança e fidelidade na consagração', tratado:'Cap. 175–182', leitura:'Ap 12,1-17 — A mulher e o dragão', oracoes:'Rosário (Gloriosos), Sub Tuum Praesidium', exercicio:'Plano de fidelidade: como manter a consagração' },
      { day:32, subtheme:'Últimas disposições — pureza de intenção', tratado:'Cap. 266–273', leitura:'Lc 1,39-45 — A visitação', oracoes:'Ladainha de Nossa Senhora, Ladainha dos Santos, Rosário completo', exercicio:'Confissão sacramental (recomendada) e Eucaristia' },
      { day:33, subtheme:'Dia da Consagração — Entrega Total', tratado:'Ato de Consagração completo (fórmula de São Luís)', leitura:'Lc 1,46-55 — Magnificat', oracoes:'Ato de Consagração de São Luís, Rosário completo, Ladainha de N. Senhora, Te Deum', exercicio:'Renovar a consagração. Comunhão eucarística. Silêncio de adoração.' },
    ] },
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
  userPrayers: PrayerItem[];
  onDeleteUserPrayer: (index: number) => void;
}) {
  const q = searchTerm.toLowerCase().trim();

  const filterPrayers = (prayers: PrayerItem[]) =>
    q ? prayers.filter(p => p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q)) : prayers;

  const filtHabituais = filterPrayers([...habituais, ...userPrayers]);
  const filtLadainhas = filterPrayers(ladainhas);
  const filtFormais   = filterPrayers(formais);

  const total = filtHabituais.length + filtLadainhas.length + filtFormais.length;

  if (q && total === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-[#1A1A1A]/10">
        <Search className="w-8 h-8 text-[#1A1A1A]/20 mx-auto mb-3" />
        <p className="text-[#1A1A1A]/40 italic text-sm">Nenhuma oração encontrada para "{searchTerm}".</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {filtHabituais.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] px-1">
            Orações Habituais {q && <span className="text-[#1A1A1A]/30 font-normal normal-case">({filtHabituais.length})</span>}
          </h3>
          <div className="space-y-2">
            {filtHabituais.map((p, i) => {
              const isUser = i >= habituais.length;
              const userIdx = isUser ? i - habituais.length : -1;
              return (
                <div key={i} className="relative group">
                  <PrayerCard prayer={p} />
                  {isUser && (
                    <button
                      onClick={() => onDeleteUserPrayer(userIdx)}
                      title="Remover oração"
                      className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {filtLadainhas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] px-1">
            Ladainhas {q && <span className="text-[#1A1A1A]/30 font-normal normal-case">({filtLadainhas.length})</span>}
          </h3>
          <div className="space-y-2">{filtLadainhas.map((p, i) => <PrayerCard key={i} prayer={p} />)}</div>
        </div>
      )}
      {filtFormais.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] px-1">
            Orações Formais {q && <span className="text-[#1A1A1A]/30 font-normal normal-case">({filtFormais.length})</span>}
          </h3>
          <div className="space-y-2">{filtFormais.map((p, i) => <PrayerCard key={i} prayer={p} />)}</div>
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

function ConsecrationTab() {
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [openDay, setOpenDay] = useState<number | null>(null);

  // Dias marcados como concluídos — persiste no localStorage
  const [completedDays, setCompletedDays] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('consecration_33days');
      if (saved) return new Set(JSON.parse(saved) as number[]);
    } catch {}
    return new Set<number>();
  });

  const toggleDay = (dayNumber: number) => {
    setCompletedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      try { localStorage.setItem('consecration_33days', JSON.stringify([...next])); } catch {}
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
                    try { localStorage.removeItem('consecration_33days'); } catch {}
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

// ── Componente Principal ──────────────────────────────────────────────────────
const USER_PRAYERS_KEY = 'caminho_user_prayers';

export default function Prayers() {
  const [sub, setSub] = useState<SubTab>('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [userPrayers, setUserPrayers] = useState<PrayerItem[]>(() => {
    try {
      const raw = localStorage.getItem(USER_PRAYERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const saveUserPrayer = () => {
    if (!newTitle.trim() || !newText.trim()) return;
    const updated = [...userPrayers, { title: newTitle.trim(), text: newText.trim() }];
    setUserPrayers(updated);
    try { localStorage.setItem(USER_PRAYERS_KEY, JSON.stringify(updated)); } catch {}
    setNewTitle(''); setNewText(''); setShowAddModal(false);
  };

  const deleteUserPrayer = (index: number) => {
    const updated = userPrayers.filter((_, i) => i !== index);
    setUserPrayers(updated);
    try { localStorage.setItem(USER_PRAYERS_KEY, JSON.stringify(updated)); } catch {}
  };

  const tabs = [
    { id: 'daily' as SubTab, label: 'Orações Cotidianas', icon: <Heart className="w-4 h-4" /> },
    { id: 'adoration' as SubTab, label: 'Adoração Eucarística', icon: <Star className="w-4 h-4" /> },
    { id: 'consecration' as SubTab, label: 'Consagração a Jesus Cristo', icon: <BookOpen className="w-4 h-4" /> },
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
                    rows={8}
                    className="w-full px-4 py-3 bg-[#F5F2ED] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]/30 text-sm resize-none font-serif"
                  />
                </div>
                <button
                  onClick={saveUserPrayer}
                  disabled={!newTitle.trim() || !newText.trim()}
                  className="w-full py-3.5 bg-[#5A5A40] text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:scale-[1.02] transition-all"
                >
                  <Save className="w-4 h-4" /> Salvar Oração
                </button>
                <p className="text-[10px] text-center text-[#1A1A1A]/30">Orações adicionadas ficam salvas no seu dispositivo.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
