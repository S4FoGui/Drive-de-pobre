const fs = require('fs');
const path = require('path');

const list = `
[Rc 377 10 no ataque, acerte sua mentalidade](https://www.youtube.com/watch?v=YUgVLtwliT8&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=1&pp=iAQB)
[RC 376 PERSEGUIÇÃO NO TRABALHO, como vencer?](https://www.youtube.com/watch?v=SQyvj7vCsZI&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=2&pp=iAQB)
[RC 383 PRINCÍPIO DO CRIADOR, o que sua obra diz sobre vc](https://www.youtube.com/watch?v=ylI_VtkYPtI&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=3&pp=iAQB)
[RC 382 PQ VC N CONSEGUE TER CONSTÂNCIA? Aprenda sobre foco interno](https://www.youtube.com/watch?v=kB_DnCD_mR0&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=4&pp=iAQB)
[RC 379 CRISE DE IDENTIDADE, para de se definir por coisas passageiras](https://www.youtube.com/watch?v=dT2D3IFpNlQ&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=5&pp=iAQB)
[RC 378 pq os planos fracassam, o diabo só precisa de um prego p/ destruir sua casa](https://www.youtube.com/watch?v=Ckg6pzSZlJI&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=6&pp=iAQB0gcJCdwKAYcqIYzv)
[Rc 367 HORIZONTES DE CONSCIÊNCIA e a transcendência e o  q isso impacta na sua vida](https://www.youtube.com/watch?v=2LMe00UVllc&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=7&pp=iAQB)
[RC 375 CADAR QUAL SEU MELHOR CAMINHO? FIKHA QUAL O SEU SONHO?](https://www.youtube.com/watch?v=pPqS-PD7i30&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=8&pp=iAQB)
[RC 373 FILHA SEJA POLICIAL](https://www.youtube.com/watch?v=bdDPpZkhOKI&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=9&pp=iAQB)
[RC 374 APRENDA ESTRATÉGIA DE COMBATE: pratique o mushin e n deixe a ansiedade t sabotar](https://www.youtube.com/watch?v=JJvrKqulpqU&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=10&pp=iAQB)
[DC 372 RESPEITE OS VELHOS EM UMA PROFISSÃO QUE ENCERRA NOS JOVENS](https://www.youtube.com/watch?v=EKrcDFCygpE&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=11&pp=iAQB)
[RC 371 ONDE NASCE TODAS AS AÇÕES, a raiz de todo pensamento, aprenda a hierarquia dos sentidos](https://www.youtube.com/watch?v=HLHm0XYeVkk&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=12&pp=iAQB)
[Rc 370 POR ISSO QUEM T FERE VENCE, sobre perdão, culpa e performance](https://www.youtube.com/watch?v=v4x2MXOooP0&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=13&pp=iAQB)
[369 CONEXÃO PELA DOR, o peso de ser imaturo em seus propósitos](https://www.youtube.com/watch?v=1DL8wEBgcsw&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=14&pp=iAQB)
[RC 368 TESTE DE DUPLA FENDA, QM é vc?](https://www.youtube.com/watch?v=dExoiLX0Hp0&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=15&pp=iAQB)
[RC 366 VC É DE VERDADE OU DE MENTIRA, qual seus frutos? Eles n negam.](https://www.youtube.com/watch?v=jUxhg5crq4k&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=16&pp=iAQB)
[RC 365 BURNOUT : o tropeço dos fortes, como Deus tratou o escolhido](https://www.youtube.com/watch?v=WPjLX8ioqH8&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=17&pp=iAQB)
[RC 364 CURANDO DEPRESSÃO- BUSQUE O REINO](https://www.youtube.com/watch?v=YNvPe22PInQ&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=18&pp=iAQB)
[Rc 363 HOMENS N PEDEM SOCORRO, uma troca de ideia sobre depressão e saúde mental](https://www.youtube.com/watch?v=EjYJu8Z1gKk&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=19&pp=iAQB)
[Rc 362 VC PRECISA TER TESÃO](https://www.youtube.com/watch?v=lURTabvyyFA&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=20&pp=iAQB)
[RC 361 APRENDA SOBRE ARQUÉTIPO, como isso pode ajudar construir sua mentalidade](https://www.youtube.com/watch?v=shg1FthWa6Q&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=21&pp=iAQB)
[Rc 360 PQ AS RELAÇÕES TERMINAM , onde começa a queda](https://www.youtube.com/watch?v=-yQwuX-V734&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=22&pp=iAQB0gcJCdwKAYcqIYzv)
[Rc 359 ESTRATÉGIA: teoria das q bocas, como organizar a vida?](https://www.youtube.com/watch?v=u0YWuh-LiCg&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=23&pp=iAQB0gcJCdwKAYcqIYzv)
[RC 358 como consigo respeito? vc se dá ao respeito?](https://www.youtube.com/watch?v=5Xt2lVM9W_Y&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=24&pp=iAQB)
[RC 357 SAIBA SEU VALOR, cure suas feridas, de limite](https://www.youtube.com/watch?v=SK4XW7E_1Nw&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=25&pp=iAQB)
[RC 356 CURANDO DORES, como reparar feridas, para viver em aliança](https://www.youtube.com/watch?v=thyGrWC9pGk&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=26&pp=iAQB)
[RC 355 carnaval/moral-cristã/ desafio-quaresma](https://www.youtube.com/watch?v=31yHCM8-Hbg&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=27&pp=iAQB)
[RC 354 O Q TODA MULHER BUSCA, filha, entenda suas dores e seus medos](https://www.youtube.com/watch?v=4sl_9EcoUUU&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=28&pp=iAQB)
[353 O super poder da mulher, manual da mulher](https://www.youtube.com/watch?v=1p9HmCEebGM&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=29&pp=iAQB)
[352 MANUAL DA MULHER EM ALIANÇA, IMPORTÂNCIA E IMPACTO](https://www.youtube.com/watch?v=k74VUYx0mAc&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=30&pp=iAQB)
[Rc 351 MANUAL DO HOMEM FRACO](https://www.youtube.com/watch?v=c2a2NmJtDVU&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=31&pp=iAQB)
[RC 350 VC MERECE UMA MULHER CONFORME A IGREJA? Vc tá sendo conforme CRISTO?](https://www.youtube.com/watch?v=vhzauK7uLd8&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=32&pp=iAQB)
[RC 349 Manual do homem, como construir uma identidade, Ritos de passagem. Mente blindada](https://www.youtube.com/watch?v=C5ErhJgCkJA&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=33&pp=iAQB0gcJCdwKAYcqIYzv)
[Rc 348 QUE HOMEM VC É? Que homem vc busca ser? Entenda o que todo homem busca.](https://www.youtube.com/watch?v=Mo1EzCZRe0Y&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=34&pp=iAQB)
[Rc 347 MANUAL DO HOMEM DE FAMÍLIA, deveres do dono do barco](https://www.youtube.com/watch?v=Jzu8stvsIfA&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=35&pp=iAQB0gcJCdwKAYcqIYzv)
[Rc 345 “pela minha honra” : mas vc sabe o que isso significa?](https://www.youtube.com/watch?v=-ERcYWkUo2A&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=36&pp=iAQB)
[346 casamento como Aliança, vc entende o que isso significa?](https://www.youtube.com/watch?v=4KLSvgJazTo&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=37&pp=iAQB)
[Rc 343 8 hábitos que limitam seu crescimento](https://www.youtube.com/watch?v=2q6MlgdSeuw&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=38&pp=iAQB)
[Rc 344 O HERÓIS DOS EMOS: O PINGUIM NILISTA](https://www.youtube.com/watch?v=1Xq1dw16mtY&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=39&pp=iAQB)
[Rc 342 Praticando o desapego, desafio de uma mente escassa](https://www.youtube.com/watch?v=7aN9HSHfdnk&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=40&pp=iAQB0gcJCdwKAYcqIYzv)
[Rc 341 Relógios que o Cadar usa, reagindo as marcas e modelos. G-shock/t- rex/ Garmin](https://www.youtube.com/watch?v=S6j741PJwPI&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=41&pp=iAQB)
[AVISO: 2º SEMANA DE MENTALIDADE DE 1-9 de fevereiro](https://www.youtube.com/watch?v=cQg_3VyRXaI&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=42&pp=iAQB)
[RC 340 NADA PODE ME FERIR, SE TORNANDO SR DO SEU TEMPO](https://www.youtube.com/watch?v=LeNXJdi2_yQ&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=43&pp=iAQB)
[Rc 338 PQ DE BOAS INTENÇÕES O INFER. Tá cheio?](https://www.youtube.com/watch?v=UH6zNPnl5X8&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=44&pp=iAQB)
[RC 337 A COLHER N EXISTE  APRENDA A RESSIGNIFICAR A REALIDADE, curando traumas](https://www.youtube.com/watch?v=GjrvIi1jgJE&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=45&pp=iAQB)
[Rc 336 pq queremos ser Deus? Pq temos necessidade de controlar a natureza das coisas?](https://www.youtube.com/watch?v=eblkl3-_efU&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=46&pp=iAQB)
[RC 335 Ao primeiro pecado, atalho para o inferno](https://www.youtube.com/watch?v=RvRsuQzoR2M&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=47&pp=iAQB)
[RC 334 ENTENDENDO A NATUREZA DAS COISAS, CURANDO A MENTE](https://www.youtube.com/watch?v=xgfLv0nWJfk&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=48&pp=iAQB)
[RC 333 “EU N CONSIGO” : aprenda vencer suas crenças limitantes](https://www.youtube.com/watch?v=8hjB9C4_C9s&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=49&pp=iAQB)
[RC 332 CADAR EU N CONSIGO- vc n é burro, vc só é medroso.](https://www.youtube.com/watch?v=H6gFsv5RT1Q&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=50&pp=iAQB)
[RC 331 presa ou caçador, quem vc é? Por vc, por seus sonhos, por sua família escolha lutar](https://www.youtube.com/watch?v=1PRF4dTJEeo&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=51&pp=iAQB)
[RC 330 PQ N EU: DESEJE MAIS SEUS OBJETIVOS QUE SEU EGO- conclusão da semana de mentalidade](https://www.youtube.com/watch?v=7M2A3VSqkYc&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=52&pp=iAQB)
[RC 329 COMO VENCER O EGO TRANSFORMA MINHA VIDA, CONCLUSÃO/TROCA DE IDEIA](https://www.youtube.com/watch?v=zdQ-dUZWqyk&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=53&pp=iAQB)
[328  VITORIA sobre o ego: ferramentas para vc aprender vencer seu ego](https://www.youtube.com/watch?v=e5pWhrHbNbk&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=54&pp=iAQB)
[RC 327 ENTENDA O QUANTO O EGO T DEIXA CEGO, aprenda a detectar o que faz vc desviar do seu caminho](https://www.youtube.com/watch?v=R7yfKQ01ZB4&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=55&pp=iAQB)
[RC 326 O EGO É SEU INIMIGO: entendendo o ego](https://www.youtube.com/watch?v=FmD-re0l_kc&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=56&pp=iAQB)
[RC 325 LUGAR QUE NUNCA ESTIVE, cemitério dos derrotados, aprenda a vencer](https://www.youtube.com/watch?v=p2NRyZ2U98Q&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=57&pp=iAQB)
[Rc 324 AUTO DETERMINAÇÃO: SONHOS PRECISAM DE AÇÃO, PRECISAM DE SUA LIDERANÇA](https://www.youtube.com/watch?v=0Ad_JN2sG_s&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=58&pp=iAQB)
[RC 323 DESEJOS PARA UMA VIDA NOVA: ACREDITE NO IMPOSSÍVEL](https://www.youtube.com/watch?v=C_9LnxwNgn8&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=59&pp=iAQB)
[RC 322 CURANDO TORMENTOS DO HOMEM BOM, angústias da comparação que enfraquecem vc](https://www.youtube.com/watch?v=zp8MRptRkIs&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=60&pp=iAQB)
[321 PODER DO PERDÃO NA SUA ESTRATÉGIA DE LONGO PRAZO, especial fim de ano](https://www.youtube.com/watch?v=eGTQGlVB1ho&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=61&pp=iAQB)
[Rc 320 PARA SAIR DA MATRIX, SEJA CINICO! O que a escola filosófica de Diógenes pode nos ajudar](https://www.youtube.com/watch?v=CjOF2P4kI_I&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=62&pp=iAQB)
[RC 319 QUEBRA DE EXPECTATIVA: a morte do espírito, aprenda curar traumas, relações e planos](https://www.youtube.com/watch?v=S6bYHix29KM&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=63&pp=iAQB)
[RC 317 CADAR N PEDE AJUDA, ande mancando mas n se apoie em 0t4rio](https://www.youtube.com/watch?v=hMTfV6tuO9E&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=64&pp=iAQB)
[RC 316 PARA VENCER TEMPESTADES, saiba onde deposita sua confiança.](https://www.youtube.com/watch?v=S8hZ0MvGBUA&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=65&pp=iAQB)
[Rc 315 N ENTREGUE SEU FUZIL, diante da tempestade, SUSTENTE](https://www.youtube.com/watch?v=WtLG4EHoXTo&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=66&pp=iAQB)
[Rc 314 LEÃO ATÉ CAÍDO É UM LEÃO, pressão revela qm é qm](https://www.youtube.com/watch?v=OIvZ6w5X-Ws&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=67&pp=iAQB)
[RC 313 FUI BANIDO, pq? Quem me denunciou?](https://www.youtube.com/watch?v=hjuqoHwQwLo&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=68&pp=iAQB)
[BANIDO DO INSTAGRAM](https://www.youtube.com/watch?v=yGb3W1F6SEw&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=69&pp=iAQB)
[Rc 312 DEIXE SEUS AMIGOS PARA TRÁS, UMA TROCA DE IDEIA SOBRE AS ARMADILHAS DO PROCESSO](https://www.youtube.com/watch?v=n5ZCe0zgQZY&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=70&pp=iAQB0gcJCdwKAYcqIYzv)
[RC 311 VENÇA SUAS CRENÇAS LIMITANTES, PARE DE DESCULPAS!](https://www.youtube.com/watch?v=1wBmqhXQBRw&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=71&pp=iAQB)
[RC 310 O que é ser leal? Lealdade n prescreve e o que isso diz sobre vc](https://www.youtube.com/watch?v=kkFPDJFQIQE&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=72&pp=iAQB)
[RC 309 SE EU N FIZER PELO MEU PLANO, QUEM VAI FAZER?](https://www.youtube.com/watch?v=3JCtkyAKS9o&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=73&pp=iAQB)
[COMO ADQUIRIR AS CAMISAS DO PROJETO?](https://www.youtube.com/watch?v=UiO6TPIk9wQ&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=74&pp=iAQB)
[RC 307 HONRAR PAI E MÃE, PERDOAR O PASSADO PARA PODER SEGUIR EM FRENTE](https://www.youtube.com/watch?v=CJ59CmMgRwk&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=75&pp=iAQB)
[RC 308 PARE DE TEORIA, O MUNDO É DOS PRÁTICOS, AÇÃO, MATA O MEDO](https://www.youtube.com/watch?v=NR5kHTwKJfk&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=76&pp=iAQB)
[HORA DE DORMIR, COM KAKAROTO](https://www.youtube.com/watch?v=SW2SC2OvcRU&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=77&pp=iAQB)
[RC 306 TODO MUNDO É INVEJOSO, TEORIA DO CALDEIRÃO](https://www.youtube.com/watch?v=CrQG85wPiSI&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=78&pp=iAQB)
[Rc 305 PQ N VC?](https://www.youtube.com/watch?v=uwYQFz9IZqk&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=79&pp=iAQB)
[Rc 304 NA SELVA SER FORTE É NECESSIDADE](https://www.youtube.com/watch?v=zOJ6UcArU3U&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=80&pp=iAQB)
[Rc 299 SUA MENTE É UM RIO E SE N APRENDER A NAVEGAR, vc se afoga.](https://www.youtube.com/watch?v=NMnPcHQ7XZI&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=81&pp=iAQB)
[Rc 303 Como vencer a guerra contra o crime? Estudo do crime](https://www.youtube.com/watch?v=OnmJa-zeZ28&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=82&pp=iAQB)
[Rc 302 CONHEÇA SEU INIMIGO, entenda como surgem as facções, quais as suas fraquezas e motivações](https://www.youtube.com/watch?v=pcdrV2GISnM&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=83&pp=iAQB)
[Rc 301 ANATOMIA DA GUERRA, sangue de heróis/ estudo sobre vitimização policial](https://www.youtube.com/watch?v=WAKM5a5W0u4&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=84&pp=iAQB)
[RC 300 História do CRIME, evolução da violência no Estado do rj](https://www.youtube.com/watch?v=k74GfY29RyY&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=85&pp=iAQB)
[SEUS DOGMAS VÃO T M4T4R | rc 46](https://www.youtube.com/watch?v=XnwUyHAQzas&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=86&pp=iAQB)
[Rc 298 VC É MADURO, entenda isso e aprenda um hack para lidar com as pessoas](https://www.youtube.com/watch?v=jL63P6Q2wO8&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=87&pp=iAQB)
[Rc 297 N VALE A PENA SER POLICIAL, o q entender isso pode ajudar na sua vida DEVORADOR DE PECADOS 4](https://www.youtube.com/watch?v=cP_izP3Aa18&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=88&pp=iAQB)
[Rc 296 FAÇA VALER O SANGUE DOS QUE LUTAM, PARA QUE VC POSSA VIVER, devorador de pecados](https://www.youtube.com/watch?v=rVpr53RM6Mc&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=89&pp=iAQB)
[Rc 295 síndrome do herói incompreendido](https://www.youtube.com/watch?v=wG92lV2nUt8&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=90&pp=iAQB)
[Rc 294 PQ VC É HERÓI? Para ser aplaudido ou pq acha certo? VÍTIMA N VENCE, Ninguém t deve nada](https://www.youtube.com/watch?v=gsKzgGYPZ1I&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=91&pp=iAQB)
[Rc 293 NINGUÉM T DEVE NADA, leis da selva vitima n vence, entenda o dano que esse troféu causa](https://www.youtube.com/watch?v=rPCtaukWcMI&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=92&pp=iAQB)
[Rc 292 COMUNHÃO PARA O PROPÓSITO, um pacto da matilha](https://www.youtube.com/watch?v=9BdtvTz9J8k&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=93&pp=iAQB)
[Rc 291 QUE TIPO DE SOLDADO VC É? Aula de milhões sobre gestão e liderança](https://www.youtube.com/watch?v=cNcL7AVhYsw&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=94&pp=iAQB)
[Rc 289 PARA CHEGAR NESSE DIA FORAM NECESSÁRIAS 1000 derrotas](https://www.youtube.com/watch?v=xnzIXpA_pKw&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=95&pp=iAQB)
[Rc 290 NENHUM HOMEM É FIEL OU VIRTUOSO](https://www.youtube.com/watch?v=-gtQ3zEAERE&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=96&pp=iAQB)
[Aprenda direcionar seu monstro](https://www.youtube.com/watch?v=8KfqrzyDe-c&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=97&pp=iAQB)
[Rc 288 O ÓDIO DO DERROTADO, direcione seu lado negativo, quando vc olha para o abismo ele olha p/ vc](https://www.youtube.com/watch?v=-AHSQky_f54&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=98&pp=iAQB)
[Rc 287 M4T3 o menino, está na hora de assumir o controle da sua vida, leve seu jogo a sério](https://www.youtube.com/watch?v=ftzK9VXyCOA&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=99&pp=iAQB)
[O QUE FORMA A MENTALIDADE DE OPERAÇÕES ESPECIAIS? Leia a descrição 🔽🔽🔽🔽](https://www.youtube.com/watch?v=5g9PQWd8W3Q&list=PLwinAdFkfTrUSleAJEJETae9NoHLP8YOb&index=100&pp=iAQB)
`;

const subject = "RC";

const extractLinks = (text) => {
  const regex = /\[(.*?)\]\((.*?)\)/g;
  const links = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    links.push({ title: match[1], url: match[2] });
  }
  return links;
};

const materialsToAdd = extractLinks(list).map(link => ({
  id: Date.now() + '-' + Math.random().toString(16).slice(2, 8),
  title: link.title,
  subject: subject,
  type: "video",
  url: link.url
}));

const dbPath = path.join(__dirname, '../database.json');
const videoLinksPath = path.join(__dirname, '../uploads/links-video/links.json');

// Ensure subjects exist
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
if (!db.subjects.includes(subject)) {
  db.subjects.push(subject);
}
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

// Add to video links
const videoLinks = JSON.parse(fs.readFileSync(videoLinksPath, 'utf8'));
videoLinks.push(...materialsToAdd);
fs.writeFileSync(videoLinksPath, JSON.stringify(videoLinks, null, 2));

console.log(`Successfully added ${materialsToAdd.length} videos to ${subject}.`);
