import React, { useEffect, useState } from 'react';
import { Shield, Star, Info, CheckCircle2, Target, X, TrendingUp, BookOpen, Book } from 'lucide-react';
import { Virtue } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../contexts/AuthContext';

const VIRTUE_CATEGORIES = [
  { id: 'teologais', label: 'Teologais', color: 'bg-blue-50 border-blue-200 text-blue-800', dot: 'bg-blue-500' },
  { id: 'cardeais', label: 'Cardeais', color: 'bg-purple-50 border-purple-200 text-purple-800', dot: 'bg-purple-500' },
  { id: 'humanas', label: 'Humanas & Morais', color: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-500' },
];

const VIRTUE_DATA: Record<string, {
  category: string;
  description: string;
  catechism: string;
  scripture: string;
  howTo: string;
  practices: string[];
  quote: string;
}> = {
  fe: {
    category: 'teologais',
    description: 'A fé é a virtude teologal pela qual cremos em Deus e em tudo o que Ele nos disse e revelou, e que a Santa Igreja nos propõe acreditar. Ela é um dom gratuito de Deus e um ato humano livre.',
    catechism: 'CIC §1814–1816: "A fé é um dom de Deus, uma virtude sobrenatural infundida por Ele."',
    scripture: '"A fé é o fundamento do que se espera, a prova das realidades que não se veem." (Hb 11,1)',
    howTo: 'A fé cresce quando a pedimos a Deus em oração, quando a professamos publicamente, quando a nutrimos com o estudo da Palavra e do Catecismo e quando a praticamos nas obras.',
    practices: [
      'Fazer um ato de fé explícito ao acordar: "Meu Deus, creio em Vós porque sois a verdade..."',
      'Ler um capítulo do Evangelho ou de um livro espiritual todo dia por 10 minutos',
      'Defender a verdade da fé com caridade quando for questionada ou atacada',
    ],
    quote: '"A fé sem obras é morta." — São Tiago 2,17',
  },
  esperanca: {
    category: 'teologais',
    description: 'A esperança é a virtude teologal pela qual desejamos o Reino dos céus e a vida eterna como nossa felicidade, esperando as promessas de Cristo e apoiando-nos na graça do Espírito Santo.',
    catechism: 'CIC §1817–1821: "A esperança é a virtude teologal pela qual desejamos o Reino dos céus."',
    scripture: '"A esperança não engana, porque o amor de Deus foi derramado em nossos corações." (Rm 5,5)',
    howTo: 'Alimenta-se pela meditação das promessas de Cristo, pela confiança na Providência e pela oração de súplica nos momentos de tribulação.',
    practices: [
      'Recorrer a Deus em momentos de desânimo com a oração: "Senhor, em Vós confio"',
      'Rezar pelas almas do purgatório, ato de grande esperança cristã',
      'Manter o olhar nas promessas eternas ao enfrentar contratempos do dia a dia',
    ],
    quote: '"A esperança não é uma ilusão; é a certeza de que Deus cumpre suas promessas." — São João Paulo II',
  },
  caridade: {
    category: 'teologais',
    description: 'A caridade é a virtude teologal pela qual amamos a Deus sobre todas as coisas por Ele mesmo e ao próximo como a nós mesmos por amor de Deus. É o vínculo de toda perfeição.',
    catechism: 'CIC §1822–1829: "A caridade é a forma de todas as virtudes" e "o mandamento novo de amar como Cristo nos amou."',
    scripture: '"Se eu falar as línguas dos homens e dos anjos, mas não tiver caridade, serei como bronze que soa." (1Cor 13,1)',
    howTo: 'Cresce pela recepção frequente da Eucaristia, pelo exercício constante de pequenos atos de amor e pela imitação do amor misericordioso de Cristo.',
    practices: [
      'Fazer um favor a alguém que não pode retribuir sem esperar reconhecimento',
      'Falar bem de quem te criticou; rezar por quem te ofendeu',
      'Visitar um doente, idoso ou solitário pelo menos uma vez por semana',
    ],
    quote: '"A medida do amor é amar sem medida." — Santo Agostinho',
  },
  prudencia: {
    category: 'cardeais',
    description: 'A prudência é a virtude que dispõe a razão prática a discernir em qualquer circunstância o nosso verdadeiro bem e a escolher os meios adequados para realizá-lo. É a auriga das virtudes.',
    catechism: 'CIC §1806: "A prudência dispõe a razão prática para discernir o verdadeiro bem e escolher os meios retos de o realizar."',
    scripture: '"O homem prudente reconhece o passo certo; os imprudentes anunciam a própria loucura." (Pr 13,16)',
    howTo: 'Alcança-se pelo conselho de pessoas sábias, pela oração pedindo luz ao Espírito Santo, pela reflexão serena antes de agir e pelo estudo dos princípios morais católicos.',
    practices: [
      'Parar 1 minuto antes de qualquer decisão importante e perguntar: "Isso agrada a Deus?"',
      'Buscar o conselho de um diretor espiritual ou pessoa de confiança antes de grandes escolhas',
      'Evitar falar impulsivamente; praticar o silêncio antes de responder em situações tensas',
    ],
    quote: '"Age de tal modo que possas querer que todos ajam da mesma forma." — São Tomás de Aquino',
  },
  justica: {
    category: 'cardeais',
    description: 'A justiça é a virtude moral que consiste na vontade constante e firme de dar a Deus e ao próximo o que lhes é devido. Ela é a virtude social por excelência.',
    catechism: 'CIC §1807: "A justiça é a vontade constante de dar a Deus e ao próximo o que lhes é devido."',
    scripture: '"Buscai primeiro o Reino de Deus e a sua justiça, e tudo mais vos será dado em acréscimo." (Mt 6,33)',
    howTo: 'Pratica-se pelo respeito escrupuloso aos direitos de cada um, pelo cumprimento fiel dos próprios deveres e pela restituição do que foi tomado injustamente.',
    practices: [
      'Pagar dívidas e compromissos pontualmente, sem fazer o próximo esperar',
      'Dar a Deus o tempo que Lhe é devido: Missa dominical, oração diária, sacramentos',
      'Quando cometer uma injustiça, repará-la o mais brevemente possível',
    ],
    quote: '"A justiça sem misericórdia é crueldade; a misericórdia sem justiça é a mãe da dissolução." — Santo Tomás de Aquino',
  },
  fortaleza: {
    category: 'cardeais',
    description: 'A fortaleza é a virtude moral que assegura firmeza nas dificuldades e constância na busca do bem. Dá coragem para resistir às tentações e superar os obstáculos na vida espiritual.',
    catechism: 'CIC §1808: "A fortaleza assegura firmeza nas dificuldades e constância na procura do bem."',
    scripture: '"Tudo posso naquele que me fortalece." (Fl 4,13)',
    howTo: 'Fortalece-se pelo sacrifício voluntário, pela aceitação das cruzes cotidianas e pela confiança inabalável na força que vem de Deus e não de nós mesmos.',
    practices: [
      'Cumprir os próprios deveres (oração, trabalho, família) mesmo sem vontade ou disposição',
      'Não reclamar de cansaço ou dificuldades; oferecer o sofrimento a Deus',
      'Enfrentar com fé um medo específico, pedindo a proteção de Deus',
    ],
    quote: '"O cristão não se define por suas qualidades, mas pela força que Deus deposita nele." — São João Paulo II',
  },
  temperanca: {
    category: 'cardeais',
    description: 'A temperança é a virtude moral que modera a atração pelos prazeres e assegura o domínio da vontade sobre os instintos. Ela orienta para o equilíbrio no uso dos bens criados.',
    catechism: 'CIC §1809: "A temperança assegura o domínio da vontade sobre os instintos e mantém os desejos dentro dos limites da honestidade."',
    scripture: '"Todo atleta é temperante em tudo. Eles o fazem para obter uma coroa corruptível, mas nós, uma incorruptível." (1Cor 9,25)',
    howTo: 'Alcança-se pela mortificação voluntária dos sentidos, pelo jejum e abstinência, e pelo domínio disciplinado da vontade sobre as inclinações desordenadas.',
    practices: [
      'Deixar de comer algo que aprecia muito em ao menos uma refeição por semana como mortificação',
      'Limitar o uso de redes sociais, televisão ou jogos a um tempo determinado por dia',
      'Praticar o jejum nos dias indicados pela Igreja (Quarta-feira de Cinzas e Sexta-Feira Santa)',
    ],
    quote: '"O homem temperante é senhor de si mesmo." — São Tomás de Aquino',
  },
  humildade: {
    category: 'humanas',
    description: 'A humildade é a virtude que nos faz conhecer nossa verdadeira condição diante de Deus e dos homens: criaturas limitadas e pecadoras que dependem totalmente de Deus para tudo o que são e têm de bom.',
    catechism: 'CIC §2559: "A humildade é o fundamento da oração." CIC §2546: os pobres de espírito são aqueles que recebem o Reino com humildade.',
    scripture: '"Aprendei de mim, que sou manso e humilde de coração." (Mt 11,29)',
    howTo: 'Cultiva-se pela aceitação das próprias misérias diante de Deus, pelo reconhecimento de que todo bem vem d\'Ele e pela aceitação serena das humilhações como instrumentos de santificação.',
    practices: [
      'Aceitar uma correção sem se justificar; agradecer ao invés de rebater',
      'Não falar de si mesmo, nem para bem nem para mal, por um dia inteiro',
      'Realizar tarefas escondidas e humildes sem esperar reconhecimento ou elogio',
    ],
    quote: '"A humildade é a base de todas as outras virtudes no coração humano." — Santa Teresa de Ávila',
  },
  paciencia: {
    category: 'humanas',
    description: 'A paciência é a virtude de suportar os sofrimentos, contrariedades e esperas com serenidade e perseverança, por amor a Deus. É um fruto do Espírito Santo e expressão da fortaleza cristã.',
    catechism: 'CIC §1832: a paciência é listada como fruto do Espírito Santo. CIC §1808 relaciona-a à fortaleza.',
    scripture: '"Pela vossa paciência salvareis as vossas almas." (Lc 21,19)',
    howTo: 'Cultiva-se aceitando as pequenas contrariedades do dia como vindas da mão de Deus, meditando na Paixão de Cristo e pedindo ao Espírito Santo o fruto da paciência.',
    practices: [
      'Esperar com calma e sem irritação em filas, trânsito ou situações de espera',
      'Não interromper quem está falando; ouvir até o fim com interesse sincero',
      'Suportar com caridade os defeitos alheios sem comentários ou queixas',
    ],
    quote: '"Sede pacientes, irmãos, até à vinda do Senhor." — São Tiago 5,7',
  },
  pureza: {
    category: 'humanas',
    description: 'A pureza (ou castidade) é a virtude que integra a sexualidade na pessoa humana, ordenando a energia afetiva e sexual segundo os planos de Deus. Nos faz ver o corpo como templo do Espírito Santo.',
    catechism: 'CIC §2518: "Os puros de coração verão a Deus." CIC §2337: "A castidade significa a integração bem-sucedida da sexualidade na pessoa."',
    scripture: '"Bem-aventurados os puros de coração, porque verão a Deus." (Mt 5,8)',
    howTo: 'Alcança-se pela guarda dos sentidos (especialmente da visão), pela oração frequente, pela frequência aos sacramentos, pela fuga das ocasiões de pecado e pela devoção a Nossa Senhora.',
    practices: [
      'Guardar os olhos: desviar o olhar imediatamente de imagens impuras ou provocativas',
      'Confessar-se logo após qualquer queda, sem deixar para depois',
      'Rezar uma Ave-Maria toda vez que enfrentar uma tentação contra a pureza',
    ],
    quote: '"Guardai os vossos corpos em santidade." — São Paulo (1Ts 4,4)',
  },
  obediencia: {
    category: 'humanas',
    description: 'A obediência é a virtude que nos dispõe a conformar a nossa vontade à vontade dos nossos superiores legítimos, em tudo o que não contraria a lei de Deus, por amor a Ele.',
    catechism: 'CIC §1897–1900: toda autoridade legítima vem de Deus; a obediência é um dever moral. CIC §2216: honrar os pais inclui obediência.',
    scripture: '"A obediência vale mais do que os sacrifícios." (1Sm 15,22)',
    howTo: 'Pratica-se vendo a vontade de Deus naqueles que têm autoridade sobre nós (pais, superiores, Igreja) e cultivando a docilidade à voz do Espírito Santo na consciência.',
    practices: [
      'Cumprir as determinações dos superiores imediatamente e de bom grado, sem murmurar',
      'Seguir com fidelidade os ensinamentos e preceitos da Igreja mesmo quando são exigentes',
      'Obedecer às leis civis justas como expressão da ordem querida por Deus',
    ],
    quote: '"Quem a vós ouve, a mim ouve; quem a vós rejeita, a mim rejeita." — Jesus (Lc 10,16)',
  },
  caridade_fraterna: {
    category: 'humanas',
    description: 'A caridade fraterna é o amor concreto, prático e misericordioso aos irmãos em Cristo, manifestado especialmente nas obras de misericórdia corporais e espirituais. É o sinal distintivo dos discípulos de Cristo.',
    catechism: 'CIC §1825–1829: "A caridade fraterna é o mandamento novo de Jesus: amar como Ele amou." CIC §2447: as obras de misericórdia são ações caritativas.',
    scripture: '"Nisto conhecerão todos que sois meus discípulos: se vos amardes uns aos outros." (Jo 13,35)',
    howTo: 'Cresce pelo serviço generoso ao próximo, pela prática das obras de misericórdia, pelo perdão das ofensas e pela oração pelos inimigos e pelos que nos fizeram o mal.',
    practices: [
      'Ouvir com paciência e atenção alguém que precisa desabafar sem julgar ou apressar',
      'Perdoar uma ofensa concreta antes de dormir, sem guardar rancor no coração',
      'Rezar diariamente por uma pessoa difícil ou que te causou algum mal recentemente',
    ],
    quote: '"Aquilo que fizestes a um destes meus irmãos mais pequeninos, a mim o fizestes." — Jesus (Mt 25,40)',
  },
  castidade: {
    category: 'humanas',
    description: 'A castidade é a virtude que integra e ordena os impulsos sexuais segundo a dignidade da pessoa humana e o plano de Deus, contrapondo-se à imoralidade sexual e à libertinagem em todas as suas formas.',
    catechism: 'CIC §2337–2345: "A castidade significa a integração bem-sucedida da sexualidade na pessoa, e assim a unidade interior do homem em seu ser corporal e espiritual."',
    scripture: '"Fugi da imoralidade sexual. Todo pecado que o homem comete está fora do corpo; mas o que fornica peca contra o próprio corpo." (1Cor 6,18)',
    howTo: 'Alcança-se pela guarda dos sentidos, pela fuga das ocasiões de pecado, pela frequência aos sacramentos (confissão e eucaristia) e pela devoção a Nossa Senhora.',
    practices: [
      'Guardar os olhos imediatamente ao encontrar imagens impuras — desviar o olhar como ato de vontade',
      'Rezar uma Ave-Maria toda vez que sentir uma tentação contra a pureza',
      'Eliminar do celular e computador todo conteúdo que possa ser ocasião de pecado',
    ],
    quote: '"A castidade é a alegria do amor, é o amadurecimento de um dom." — São João Paulo II',
  },
  mansidao: {
    category: 'humanas',
    description: 'A mansidão é a virtude que modera os movimentos de ira e temperamento, opondo-se às explosões de raiva, à violência verbal e à agressividade. Permite agir com serenidade e equilíbrio mesmo nas provações.',
    catechism: 'CIC §1765, 2302–2303: a ira desordenada é contrária à dignidade humana; a mansidão é fruto do Espírito Santo (Gl 5,22-23).',
    scripture: '"Bem-aventurados os mansos, porque eles herdarão a terra." (Mt 5,5)',
    howTo: 'Cultiva-se pela prática do silêncio antes de responder, pela meditação na mansidão de Cristo e pela oferta a Deus de cada irritação como sacrifício espiritual.',
    practices: [
      'Antes de responder com irritação, respirar fundo e fazer uma breve oração interior',
      'Quando ofendido, esperar 10 minutos antes de responder — deixar a primeira emoção passar',
      'Ao final do dia, identificar um momento de impaciência e oferecê-lo a Deus como penitência',
    ],
    quote: '"Aprendei de mim, que sou manso e humilde de coração." — Jesus (Mt 11,29)',
  },
  benignidade: {
    category: 'humanas',
    description: 'A benignidade é a virtude que dispõe o coração a ser bom, gentil e misericordioso para com todos, combatendo a maldade, a crueldade e a dureza no trato com o próximo.',
    catechism: 'CIC §1832: a benignidade (bondade) é fruto do Espírito Santo. CIC §1829: a caridade inspira bondade e longanimidade.',
    scripture: '"Sede bondosos e compassivos uns para com os outros, perdoando-vos mutuamente, como Deus em Cristo vos perdoou." (Ef 4,32)',
    howTo: 'Desenvolve-se pelo exercício diário de pequenos atos de bondade, pela recusa de comentários maliciosos e pela prática consciente de ver o melhor no próximo.',
    practices: [
      'Fazer diariamente um elogio sincero a alguém que não espera ser elogiado',
      'Recusar-se a repetir comentários negativos sobre outras pessoas',
      'Quando irritado com alguém, rezar explicitamente por essa pessoa antes de dormir',
    ],
    quote: '"A bondade é a linguagem que o surdo pode ouvir e o cego pode ver." — Mark Twain (attr.)',
  },
  longanimidade: {
    category: 'humanas',
    description: 'A longanimidade (ou paciência longa) é a virtude de suportar com constância e serenidade as ofensas, as esperas prolongadas e as dificuldades repetidas, sem perder a paz interior nem a confiança em Deus.',
    catechism: 'CIC §1832: a longanimidade é fruto do Espírito Santo. CIC §2219: paciência e longanimidade são expressões do amor fraterno.',
    scripture: '"A caridade é paciente, é benigna; a caridade não é invejosa, não age precipitadamente." (1Cor 13,4)',
    howTo: 'Adquire-se pela meditação na Paixão de Cristo, pela aceitação das contrariedades como vontade permissiva de Deus e pela renovação diária da confiança na Providência.',
    practices: [
      'Em situações de espera (fila, trânsito), rezar em silêncio em vez de se irritar',
      'Suportar sem queixa um incômodo físico ou social por amor a Deus durante o dia',
      'Quando alguém te decepcionar repetidamente, oferecer esse sofrimento como sacrifício',
    ],
    quote: '"A paciência é a arte de esperar." — São Francisco de Sales',
  },
  modestia: {
    category: 'humanas',
    description: 'A modéstia é a virtude que regula a expressão exterior da pessoa — no vestir, no agir, na fala — opondo-se à vaidade, ao exibicionismo e ao desejo de chamar atenção para si mesmo.',
    catechism: 'CIC §2521–2524: "A modéstia protege a intimidade da pessoa. Inspira a escolha da roupa. Mantém o silêncio e a reserva onde se pressente o risco de uma curiosidade malsã."',
    scripture: '"Que as mulheres se vistam com decência e modéstia, enfeitando-se não com tranças, ouro, pérolas ou roupas caras, mas com boas obras." (1Tm 2,9-10)',
    howTo: 'Cultiva-se pelo exame das motivações ao se vestir e ao agir, pela fuga do desejo de aprovação humana e pela orientação das escolhas externas para a glória de Deus.',
    practices: [
      'Antes de sair, perguntar: "Este modo de vestir glorifica a Deus ou busca aprovação humana?"',
      'Recusar a tentação de exibir conquistas e realizações nas redes sociais por vaidade',
      'Praticar o silêncio sobre as próprias virtudes e boas obras — fazer bem sem contar',
    ],
    quote: '"A modéstia é o ornamento de todos os dons." — São Bernardo de Claraval',
  },
  continencia: {
    category: 'humanas',
    description: 'A continência (ou autocontrole) é a virtude que confere domínio sobre as paixões e impulsos desordenados, combatendo especialmente os excessos como a embriaguez, a gula e outros vícios que escravizam a vontade.',
    catechism: 'CIC §1809: a temperança "assegura o domínio da vontade sobre os instintos." CIC §2290: a temperança inclui evitar os excessos do álcool e das drogas.',
    scripture: '"Todo atleta é temperante em tudo. Eles o fazem para obter uma coroa corruptível, mas nós, uma incorruptível." (1Cor 9,25)',
    howTo: 'Desenvolve-se pela mortificação voluntária, pelo jejum, pela renúncia ao que é supérfluo e pelo fortalecimento progressivo da vontade sobre os apetites sensíveis.',
    practices: [
      'Praticar o jejum alimentar ao menos às quartas e sextas-feiras, conforme a tradição da Igreja',
      'Estabelecer um limite diário para o uso de álcool, jogos ou entretenimento e cumpri-lo',
      'Quando sentir um desejo forte de algo supérfluo, esperar 15 minutos antes de ceder',
    ],
    quote: '"O autocontrole é a força silenciosa que governa todas as outras virtudes." — Platão (attr.)',
  },
  fidelidade: {
    category: 'humanas',
    description: 'A fidelidade é a virtude que nos mantém firmes nos compromissos assumidos diante de Deus e dos homens, opondo-se à traição, à inconsistência e ao abandono dos deveres assumidos.',
    catechism: 'CIC §1646–1651: fidelidade conjugal como imagem da fidelidade de Deus. CIC §2101–2103: os votos e promessas são atos de fidelidade a Deus.',
    scripture: '"O que é fiel no mínimo também é fiel no muito; e o que é injusto no mínimo, também é injusto no muito." (Lc 16,10)',
    howTo: 'Cresce pela habitualidade nas pequenas fidelidades cotidianas, pela recusa de compromissos que não se pode cumprir e pela honra à palavra dada mesmo quando é custoso.',
    practices: [
      'Cumprir pontualmente todos os compromissos assumidos, mesmo os que "ninguém vai notar"',
      'Não fazer promessas levianamente — só prometê-las quando houver determinação de cumprir',
      'Renovar semanalmente o compromisso com os votos ou promessas mais importantes da vida',
    ],
    quote: '"Sede fiel até a morte, e eu te darei a coroa da vida." — Jesus (Ap 2,10)',
  },
  pobreza_de_espirito: {
    category: 'humanas',
    description: 'A pobreza de espírito (desprendimento) é a virtude de viver livre do apego excessivo aos bens materiais, combatendo a avareza e a idolatria do dinheiro, usando os bens como meios para servir a Deus e ao próximo.',
    catechism: 'CIC §2544–2547: "Bem-aventurados os pobres de espírito." A pobreza de espírito liberta o homem para o amor. CIC §2536: o apego aos bens pode levar à avareza.',
    scripture: '"Bem-aventurados os pobres de espírito, porque deles é o Reino dos céus." (Mt 5,3)',
    howTo: 'Alcança-se pela prática da partilha generosa, pelo desapego dos bens supérfluos, pela confiança na Providência e pela valorização dos bens espirituais acima dos materiais.',
    practices: [
      'Mensalmente, destinar uma parte do salário à caridade ou à Igreja com alegria',
      'Regularmente, doar roupas, livros ou objetos que não são necessários',
      'Quando tentado pela cobiça, perguntar: "Este bem me aproxima ou me afasta de Deus?"',
    ],
    quote: '"Não ajunteis para vós tesouros na terra... ajuntai para vós tesouros no céu." — Jesus (Mt 6,19-20)',
  },
  sinceridade: {
    category: 'humanas',
    description: 'A sinceridade é a virtude de agir e falar com veracidade e transparência, combatendo a falsidade, a hipocrisia, a dissensão e toda forma de engano nas relações humanas e com Deus.',
    catechism: 'CIC §2468–2470: "A veracidade dá ao outro o direito justo à verdade." CIC §2482: a mentira é a profanação da palavra.',
    scripture: '"Portanto, deixando a mentira, falai a verdade cada um com o seu próximo, porque somos membros uns dos outros." (Ef 4,25)',
    howTo: 'Desenvolve-se pela prática consistente de dizer a verdade mesmo quando é incômodo, pela recusa de meias-verdades e pela transparência nas relações.',
    practices: [
      'Não exagerar nem diminuir a realidade para se sair melhor em conversas',
      'Quando cometer um erro, admiti-lo imediatamente em vez de esconder ou justificar',
      'Praticar a sinceridade consigo mesmo no exame de consciência diário',
    ],
    quote: '"A verdade vos libertará." — Jesus (Jo 8,32)',
  },
  gratidao: {
    category: 'humanas',
    description: 'A gratidão é a virtude de reconhecer e expressar o apreço pelos bens recebidos de Deus e do próximo, contrapondo-se à ingratidão e à inveja, que nascem de olhar o que o outro tem em vez de valorizar o que se recebeu.',
    catechism: 'CIC §2637–2638: "A ação de graças caracteriza a oração da Igreja. Na Eucaristia, a Igreja manifesta e torna-se o que ela é." CIC §2126: a gratidão a Deus é fundamento da religião.',
    scripture: '"Dai graças em tudo, porque esta é a vontade de Deus em Cristo Jesus para convosco." (1Ts 5,18)',
    howTo: 'Cultiva-se pelo exercício diário de contar as bênçãos recebidas, pela oração de ação de graças e pela expressão explícita de agradecimento às pessoas que nos servem.',
    practices: [
      'Ao acordar, listar 3 motivos concretos de gratidão a Deus antes de sair da cama',
      'Agradecer explicitamente a alguém que normalmente não se agradece (familiar, colega)',
      'Manter um diário de gratidão onde se registram as bênçãos semanais',
    ],
    quote: '"A gratidão é a memória do coração." — Jean-Baptiste Massieu',
  },
  generosidade: {
    category: 'humanas',
    description: 'A generosidade é a virtude de dar aos outros — seja tempo, bens, atenção ou talentos — de modo livre e abundante, opondo-se ao egoísmo, à mesquinhez e à ganância.',
    catechism: 'CIC §2443–2449: "Deus abençoa quem dá com alegria." A generosidade é exigência da caridade e expressão da justiça social.',
    scripture: '"Cada um dê conforme determinou em seu coração, não com tristeza nem por obrigação, porque Deus ama quem dá com alegria." (2Cor 9,7)',
    howTo: 'Cresce pela prática regular de partilha, pelo cultivo de uma mentalidade de abundância em vez de escassez e pela meditação no exemplo de Cristo que "a si mesmo se esvaziou".',
    practices: [
      'Dar o dízimo ou uma fração significativa da renda à Igreja e aos pobres',
      'Dedicar ao menos 1 hora por semana ao voluntariado ou serviço gratuito ao próximo',
      'Quando sentir resistência em dar algo, reconhecer isso como apego e oferecer como sacrifício',
    ],
    quote: '"Não é quanto damos, mas quanto amor colocamos ao dar." — Santa Teresa de Calcutá',
  },
  afabilidade: {
    category: 'humanas',
    description: 'A afabilidade (ou cortesia) é a virtude que torna as relações humanas agradáveis, harmoniosas e respeitosas, combatendo as inimizades, as disputas egoístas e a grosseria no trato com o próximo.',
    catechism: 'CIC §1828–1829: a caridade "é paciente, é benigna, não é arrogante." CIC §2219: a cortesia fraterna é expressão do quarto mandamento.',
    scripture: '"Sede afáveis e compassivos uns para com os outros." (Ef 4,32)',
    howTo: 'Desenvolve-se pelo cultivo consciente de palavras e gestos de cordialidade, pelo interesse genuíno nas pessoas e pela recusa de qualquer forma de grosseria ou indiferença.',
    practices: [
      'Cumprimentar com genuíno interesse todas as pessoas com quem se cruza no dia',
      'Usar palavras de gratidão ("obrigado", "por favor") de modo constante e sincero',
      'Evitar o uso do celular durante conversas — dar atenção plena ao interlocutor',
    ],
    quote: '"A cortesia é a flor da humanidade." — José Saramago',
  },
  laboriosidade: {
    category: 'humanas',
    description: 'A laboriosidade é a virtude que dispõe a pessoa ao trabalho diligente, bem feito e oferecido a Deus, contrapondo-se à preguiça, à negligência e à vida desregrada que desperdiça os talentos recebidos.',
    catechism: 'CIC §2427–2429: "O trabalho humano tem origem divina. Pelo trabalho, o homem participa da obra criadora de Deus." CIC §2413: o roubo ao empregador pelo trabalho negligente é pecado.',
    scripture: '"Tudo o que fizerdes, fazei-o de todo o coração, como para o Senhor, e não para os homens." (Cl 3,23)',
    howTo: 'Cultiva-se pela santificação do trabalho cotidiano, pela oferta das atividades a Deus logo pela manhã e pela busca da excelência em tudo o que se faz como serviço a Ele.',
    practices: [
      'Antes de iniciar o trabalho do dia, oferecer a Deus toda a atividade daquele dia',
      'Fazer cada tarefa com cuidado e atenção, como se fosse entregue diretamente a Cristo',
      'Evitar a procrastinação: cumprir os deveres antes de qualquer entretenimento',
    ],
    quote: '"Ora et Labora — reza e trabalha." — São Bento de Núrsia',
  },
  perseveranca: {
    category: 'humanas',
    description: 'A perseverança é a virtude de manter-se firme no caminho do bem e na prática das virtudes, combatendo a inconstância, o desânimo espiritual e o abandono dos compromissos assumidos.',
    catechism: 'CIC §1817–1821: a perseverança final é dom de Deus e ao mesmo tempo dever do cristão. CIC §2016: a perseverança nos sacramentos e na vida de graça é necessária.',
    scripture: '"O que perseverar até ao fim será salvo." (Mt 10,22)',
    howTo: 'Adquire-se renovando a decisão de buscar a santidade todos os dias, pedindo a graça da perseverança na oração e buscando o apoio de uma comunidade espiritual.',
    practices: [
      'Renovar cada manhã a decisão de viver bem o dia — não por ano ou semana, mas dia a dia',
      'Quando cair, levantar-se imediatamente sem desânimo e voltar ao começo',
      'Manter um diário espiritual onde se registra o progresso e as recaídas com honestidade',
    ],
    quote: '"A santidade não consiste em nunca cair, mas em levantar-se após cada queda." — São João Bosco',
  },
  discricao: {
    category: 'humanas',
    description: 'A discrição é a virtude de guardar segredo e confidencialidade, de falar com prudência e moderação, opondo-se à fofoca, às intrigas, à indiscrição e às divisões que destroem comunidades.',
    catechism: 'CIC §2477–2479: "O respeito pela reputação das pessoas proíbe toda atitude e palavra susceptíveis de lhes causar dano injusto." CIC §2489: segredo profissional e discrição.',
    scripture: '"O que anda com tagarelas descobre segredos; portanto não te associes com quem não sabe fechar a boca." (Pr 20,19)',
    howTo: 'Cultiva-se pelo silêncio sobre assuntos alheios, pela recusa de transmitir informações que possam prejudicar a reputação de outros e pela disciplina da língua em geral.',
    practices: [
      'Antes de comentar algo sobre outra pessoa, perguntar: "Isso edifica ou prejudica?"',
      'Guardar como segredo tudo que for confiado em conversas privadas',
      'Praticar o "silêncio de língua" por um período do dia, especialmente em grupos',
    ],
    quote: '"O silêncio é a virtude dos sábios." — Aristóteles',
  },
  resiliencia: {
    category: 'humanas',
    description: 'A resiliência é a virtude de manter a firmeza interior e a esperança diante das adversidades, dos fracassos e das perdas, fortalecendo o caráter contra o desespero, a amargura e o desânimo.',
    catechism: 'CIC §1808: a fortaleza "assegura firmeza nas dificuldades." CIC §2734: a perseverança na oração, mesmo sem ver resultados, é expressão de resiliência espiritual.',
    scripture: '"Gloriamo-nos também nas tribulações, sabendo que a tribulação produz paciência; e a paciência, experiência provada; e a experiência provada, esperança." (Rm 5,3-4)',
    howTo: 'Desenvolve-se pela meditação na Cruz de Cristo, pela aceitação das provações como instrumentos de purificação e pelo cultivo de uma visão de fé que vê além das circunstâncias.',
    practices: [
      'Quando enfrentar uma dificuldade, meditar na Paixão de Cristo e oferecer o sofrimento a Ele',
      'Cultivar relações de apoio mútuo em uma comunidade de fé',
      'Manter um registro das dificuldades superadas como lembrança da fidelidade de Deus',
    ],
    quote: '"Tudo é graça." — Santa Teresa de Lisieux',
  },
  responsabilidade: {
    category: 'humanas',
    description: 'A responsabilidade é a virtude de assumir e cumprir com fidelidade os deveres para com a família, a comunidade, o trabalho e a Igreja, opondo-se à negligência, à irresponsabilidade e ao escapismo.',
    catechism: 'CIC §1913–1917: "A participação de cada um na vida social começa com a educação e a doutrina." CIC §2239: o cidadão tem deveres com a sociedade.',
    scripture: '"De quem muito recebeu, muito se exigirá; e a quem muito foi confiado, ainda mais se pedirá." (Lc 12,48)',
    howTo: 'Cresce pelo cumprimento fiel das obrigações cotidianas, pelo reconhecimento honesto dos erros e suas consequências e pela educação de uma consciência que não busca escapar às responsabilidades.',
    practices: [
      'Listar todas as responsabilidades atuais (família, trabalho, comunidade) e avaliá-las honestamente',
      'Quando falhar em um dever, assumir a responsabilidade sem culpar circunstâncias ou terceiros',
      'Identificar uma área de negligência na vida e criar um plano concreto de melhoria',
    ],
    quote: '"Com grande poder vem grande responsabilidade." — adaptado de Lc 12,48',
  },
};

export default function VirtuesMap() {
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [selectedVirtue, setSelectedVirtue] = useState<Virtue | null>(null);
  const [modalMode, setModalMode] = useState<'details' | 'evaluate' | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    apiFetch('/api/virtues').then(r => r.json()).then(d => { if (Array.isArray(d)) setVirtues(d); });
  }, []);

  const togglePriority = async (id: string) => {
    await apiFetch(`/api/virtues/${id}/toggle-priority`, { method: 'POST' });
    setVirtues(prev => prev.map(v => v.id === id ? { ...v, is_priority: !v.is_priority } : { ...v, is_priority: v.id === id ? true : (id === v.id ? false : v.is_priority) }));
    apiFetch('/api/virtues').then(r => r.json()).then(d => { if (Array.isArray(d)) setVirtues(d); });
  };

  const updateLevel = async (id: string, newLevel: number) => {
    await apiFetch(`/api/virtues/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ level: newLevel }),
    });
    setVirtues(prev => prev.map(v => v.id === id ? { ...v, level: newLevel } : v));
    setModalMode(null);
  };

  const openModal = (virtue: Virtue, mode: 'details' | 'evaluate') => {
    setSelectedVirtue(virtue);
    setModalMode(mode);
  };

  const closeModal = () => { setSelectedVirtue(null); setModalMode(null); };

  const filteredVirtues = activeCategory === 'all'
    ? virtues
    : virtues.filter(v => VIRTUE_DATA[v.id]?.category === activeCategory);

  const avgLevel = virtues.length ? (virtues.reduce((a, v) => a + v.level, 0) / virtues.length).toFixed(1) : '0';
  const details = selectedVirtue ? VIRTUE_DATA[selectedVirtue.id] : null;

  const getCategoryBadge = (id: string) => {
    const cat = VIRTUE_DATA[id]?.category;
    const c = VIRTUE_CATEGORIES.find(c => c.id === cat);
    return c ? (
      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${c.color}`}>
        {c.label}
      </span>
    ) : null;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Mapa de Virtudes</h2>
          <p className="text-[#1A1A1A]/60 italic">"Sede perfeitos como o vosso Pai celestial é perfeito." (Mt 5,48)</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-[#1A1A1A]/5 shadow-sm">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-[#5A5A40]">Nível Médio</p>
            <p className="text-xl font-bold">{avgLevel}</p>
          </div>
          <div className="w-px h-8 bg-[#1A1A1A]/10" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-[#5A5A40]">Em Foco</p>
            <p className="text-xl font-bold">{virtues.filter(v => v.is_priority).length}</p>
          </div>
        </div>
      </header>

      {/* Category legend */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeCategory === 'all' ? 'bg-[#5A5A40] text-white' : 'bg-white border border-[#1A1A1A]/5 text-[#1A1A1A]/50 hover:bg-[#F5F2ED]'}`}>
          Todas ({virtues.length})
        </button>
        {VIRTUE_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${activeCategory === cat.id ? 'bg-[#5A5A40] text-white border-[#5A5A40]' : `${cat.color} hover:opacity-80`}`}>
            <span className={`w-2 h-2 rounded-full ${cat.dot}`} />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVirtues.map((virtue) => (
          <div key={virtue.id}
            className={`group relative p-6 rounded-[2rem] border transition-all duration-300 ${virtue.is_priority ? 'bg-white border-[#5A5A40] shadow-lg shadow-[#5A5A40]/5' : 'bg-white border-[#1A1A1A]/5 hover:border-[#5A5A40]/30'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${virtue.is_priority ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F2ED] text-[#5A5A40]'}`}>
                <Shield className="w-5 h-5" />
              </div>
              <button onClick={() => togglePriority(virtue.id)}
                title={virtue.is_priority ? 'Remover foco' : 'Definir como foco'}
                className={`p-2 rounded-full transition-colors ${virtue.is_priority ? 'text-[#5A5A40] bg-[#5A5A40]/10' : 'text-[#1A1A1A]/10 hover:text-[#5A5A40]/50 hover:bg-[#F5F2ED]'}`}>
                <Target className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-1">{getCategoryBadge(virtue.id)}</div>
            <h3 className="text-lg font-bold mt-2 mb-1">{virtue.name}</h3>

            {details && virtue.id === selectedVirtue?.id ? null : (
              <p className="text-xs text-[#1A1A1A]/50 leading-relaxed line-clamp-2 mb-4">
                {VIRTUE_DATA[virtue.id]?.description?.slice(0, 80)}...
              </p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#1A1A1A]/40 font-sans">
                <span>Progresso</span>
                <span className="font-bold text-[#5A5A40]">Nível {virtue.level}/10</span>
              </div>
              <div className="h-2 bg-[#F5F2ED] rounded-full overflow-hidden">
                <div className="h-full bg-[#5A5A40] transition-all duration-700" style={{ width: `${virtue.level * 10}%` }} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#1A1A1A]/5">
              <button onClick={() => openModal(virtue, 'details')}
                className="text-xs font-bold text-[#5A5A40] hover:underline flex items-center gap-1">
                <Info className="w-3 h-3" /> Ver detalhes
              </button>
              <button onClick={() => openModal(virtue, 'evaluate')}
                className="px-4 py-2 bg-[#F5F2ED] text-[#5A5A40] rounded-xl text-xs font-bold hover:bg-[#E6E6A0] transition-colors flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Avaliar
              </button>
            </div>

            {virtue.is_priority && (
              <div className="absolute -top-2 -right-2">
                <div className="bg-[#5A5A40] text-white p-1 rounded-full shadow-lg">
                  <Star className="w-4 h-4 fill-current" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalMode && selectedVirtue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

              {/* Header */}
              <div className="p-8 border-b border-[#1A1A1A]/5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#F5F2ED] rounded-2xl text-[#5A5A40]">
                    {modalMode === 'evaluate' ? <TrendingUp className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{selectedVirtue.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getCategoryBadge(selectedVirtue.id)}
                      <p className="text-xs text-[#1A1A1A]/40">{modalMode === 'evaluate' ? 'Autoavaliação' : 'Sobre a Virtude'}</p>
                    </div>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-[#F5F2ED] rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-6">
                {modalMode === 'evaluate' ? (
                  <div className="space-y-8">
                    <div className="text-center">
                      <p className="text-[#1A1A1A]/60 mb-1">Nível atual: <strong>{selectedVirtue.level}/10</strong></p>
                      <p className="text-sm text-[#1A1A1A]/40 italic">
                        Como você avalia sua prática desta virtude nos últimos dias?
                      </p>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <button key={num} onClick={() => updateLevel(selectedVirtue.id, num)}
                          className={`py-4 rounded-xl font-bold text-lg transition-all ${selectedVirtue.level === num ? 'bg-[#5A5A40] text-white shadow-lg scale-105' : 'bg-[#F5F2ED] text-[#5A5A40] hover:bg-[#E6E6A0] hover:scale-105'}`}>
                          {num}
                        </button>
                      ))}
                    </div>
                    <div className="text-center text-xs text-[#1A1A1A]/30 italic">
                      1 = muito fraco · 5 = regular · 10 = excelente
                    </div>
                    <button onClick={() => setModalMode('details')}
                      className="w-full py-3 border border-[#5A5A40]/20 text-[#5A5A40] rounded-2xl text-sm font-bold hover:bg-[#F5F2ED] transition-colors">
                      Ver detalhes desta virtude
                    </button>
                  </div>
                ) : details ? (
                  <div className="space-y-6">
                    {/* Quote */}
                    <div className="p-6 bg-[#F5F2ED] rounded-2xl border-l-4 border-[#5A5A40]">
                      <p className="text-base leading-relaxed text-[#1A1A1A]/80 font-serif italic">{details.quote}</p>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2 flex items-center gap-1">
                        <Info className="w-3 h-3" /> O que é
                      </h4>
                      <p className="text-sm leading-relaxed text-[#1A1A1A]/70">{details.description}</p>
                    </div>

                    {/* Scripture */}
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Passagem Bíblica
                      </h4>
                      <p className="text-sm italic text-blue-800">{details.scripture}</p>
                    </div>

                    {/* Catechism */}
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-purple-600 mb-2 flex items-center gap-1">
                        <Book className="w-3 h-3" /> Catecismo da Igreja (CIC)
                      </h4>
                      <p className="text-sm text-purple-800">{details.catechism}</p>
                    </div>

                    {/* How to */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-2">Como Alcançar</h4>
                      <p className="text-sm leading-relaxed text-[#1A1A1A]/70">{details.howTo}</p>
                    </div>

                    {/* Practices */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#5A5A40] mb-3 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Práticas Sugeridas
                      </h4>
                      <div className="space-y-3">
                        {details.practices.map((p, i) => (
                          <div key={i} className="flex items-start gap-3 p-4 bg-[#5A5A40]/5 rounded-xl border border-[#5A5A40]/10">
                            <span className="w-6 h-6 flex-shrink-0 rounded-full bg-[#5A5A40] text-white flex items-center justify-center text-[10px] font-bold mt-0.5">{i+1}</span>
                            <p className="text-sm text-[#1A1A1A]/70">{p}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button onClick={() => setModalMode('evaluate')}
                      className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Avaliar esta Virtude
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-[#1A1A1A]/40 italic py-8">Detalhes em breve...</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
