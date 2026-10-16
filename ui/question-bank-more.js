// New original passages written around A1 Movers and A2 Flyers themes.
// Format inspiration: Cambridge English Young Learners Listening and Reading/Writing.
const bankQuestion=(prompt,answer,a,b)=>[prompt,answer,[answer,a,b]];
window.QUEST_QUESTION_BANK_MORE={
  1:{listening:[
    {audio:'Teacher: Our class is going to the library at ten. Please bring a pencil and your homework. Girl: My homework is in my blue schoolbag. Teacher: Put the bag beside the door.',questions:[
      bankQuestion('When is the class going to the library?','At ten','At nine','At eleven'),
      bankQuestion('Where is the class going?','To the library','To the classroom','To the playground'),
      bankQuestion('What should the children bring?','A pencil','A map','A ticket'),
      bankQuestion('Where should the girl put her bag?','Beside the door','Under the board','On the chair')
    ]},
    {audio:'Boy: I cannot see the board from here. Teacher: Sit in the front row. Boy: Can I borrow a book after the lesson? Teacher: Yes, during break.',questions:[
      bankQuestion('What can the boy not see?','The board','The door','The window'),
      bankQuestion('Where should the boy sit?','In the front row','At the back','By the door'),
      bankQuestion('What does the boy want to borrow?','A book','A pencil','A schoolbag'),
      bankQuestion('When may he borrow it?','During break','Before school','Tomorrow morning')
    ]}
  ],reading:[
    {context:'On Monday, Anna found a red notebook under her desk. She gave it to her teacher. At break, the teacher found its owner, Ben. Ben thanked Anna after lunch.',questions:[
      bankQuestion('On which day did Anna find the notebook?','Monday','Tuesday','Friday'),
      bankQuestion('What did Anna find?','A red notebook','A blue book','A green bag'),
      bankQuestion('Where did she find it?','Under her desk','In the library','Near the door'),
      bankQuestion('Who owned the notebook?','Ben','Mia','Zoe')
    ]},
    {context:'Mia’s class made posters about animals. She drew a dolphin and wrote three sentences. The posters went on the classroom wall. Her friend Zoe read them before the lesson.',questions:[
      bankQuestion('What were the posters about?','Animals','Sports','Weather'),
      bankQuestion('Which animal did Mia draw?','A dolphin','A tiger','A bird'),
      bankQuestion('How many sentences did Mia write?','Three','Two','Four'),
      bankQuestion('Where did the class put the posters?','On the classroom wall','In the library','Under the desk')
    ]}
  ]},
  2:{listening:[
    {audio:'Mother: Please open the bedroom window. The room is hot. Girl: I will do it after I fold the blanket. Mother: Your cousin is waiting in the garden.',questions:[
      bankQuestion('Which window should the girl open?','The bedroom window','The kitchen window','The bathroom window'),
      bankQuestion('How does the room feel?','Hot','Cold','Dark'),
      bankQuestion('What will the girl fold first?','The blanket','The towel','The shirt'),
      bankQuestion('Where is her cousin waiting?','In the garden','In the kitchen','On the sofa')
    ]},
    {audio:'Boy: Where did Grandma put the mirror? Girl: Above the sofa in the living room. Boy: The kitchen is too dark. Girl: I can turn on the light.',questions:[
      bankQuestion('Where is the mirror?','Above the sofa','Under the bed','By the door'),
      bankQuestion('Which room has the mirror?','The living room','The bedroom','The kitchen'),
      bankQuestion('Which room is too dark?','The kitchen','The garden','The bedroom'),
      bankQuestion('What can the girl turn on?','The light','The television','The radio')
    ]}
  ],reading:[
    {context:'Lily stayed at her cousin’s house on Friday. They made vegetable soup in the kitchen. After lunch, they played cards on the sofa. Lily slept in the small bedroom.',questions:[
      bankQuestion('When did Lily stay at her cousin’s house?','Friday','Saturday','Sunday'),
      bankQuestion('What did they make?','Vegetable soup','Cheese sandwiches','Fruit juice'),
      bankQuestion('Where did they play cards?','On the sofa','In the garden','By the window'),
      bankQuestion('Where did Lily sleep?','In the small bedroom','In the kitchen','On the sofa')
    ]},
    {context:'There was a loud noise by the garden window. Max looked outside and saw a little bird. His sister brought a blanket, but the bird flew into a tree. Max shut the window quietly.',questions:[
      bankQuestion('Where did Max hear a noise?','By the garden window','Near the kitchen door','In the bedroom'),
      bankQuestion('What did Max see outside?','A little bird','A cousin','A kitten'),
      bankQuestion('What did his sister bring?','A blanket','A mirror','A basket'),
      bankQuestion('Where did the bird fly?','Into a tree','Into the kitchen','Under the sofa')
    ]}
  ]},
  3:{listening:[
    {audio:'Girl: Let us have our picnic beside the lake at noon. Boy: I can bring a basket of oranges. Girl: I will make four cheese sandwiches. Boy: Please remember a bottle of water.',questions:[
      bankQuestion('Where will they have the picnic?','Beside the lake','Near the school','By the river'),
      bankQuestion('When will the picnic begin?','At noon','At nine','In the evening'),
      bankQuestion('What fruit will the boy bring?','Oranges','Apples','Grapes'),
      bankQuestion('How many sandwiches will the girl make?','Four','Two','Six')
    ]},
    {audio:'Boy: I am hungry after our walk. Girl: There is fruit in the blue basket. Boy: Is there any juice? Girl: Yes, one carton in my schoolbag.',questions:[
      bankQuestion('How does the boy feel?','Hungry','Thirsty','Tired'),
      bankQuestion('What colour is the basket?','Blue','Red','Green'),
      bankQuestion('How much juice is there?','One carton','Two bottles','Three cups'),
      bankQuestion('Where is the juice?','In my schoolbag','In the basket','On the table')
    ]}
  ],reading:[
    {context:'Ava packed lunch before school. Her basket held two sandwiches, an apple and a bottle of water. At the park, she shared the apple with Ben. They played football after eating.',questions:[
      bankQuestion('When did Ava pack lunch?','Before school','After school','After dinner'),
      bankQuestion('How many sandwiches were in the basket?','Two','One','Three'),
      bankQuestion('Who shared the apple with Ava?','Ben','Mia','Leo'),
      bankQuestion('What did they play after eating?','Football','Tennis','Basketball')
    ]},
    {context:'The picnic started at one o’clock because the bus was late. The children sat under a large tree. They ate grapes and drank orange juice. At the end, they put every bottle in a bag.',questions:[
      bankQuestion('When did the picnic start?','At one o’clock','At noon','At two o’clock'),
      bankQuestion('Why did it start late?','The bus was late','It rained','The food was lost'),
      bankQuestion('Where did the children sit?','Under a large tree','Beside the lake','Inside a bus'),
      bankQuestion('What did they drink?','Orange juice','Apple juice','Water')
    ]}
  ]},
  4:{listening:[
    {audio:'Woman: Which bus goes to the hospital? Boy: Number six. It leaves from the station at nine. Woman: Do I need a ticket? Boy: Yes, buy one at the desk.',questions:[
      bankQuestion('Which bus goes to the hospital?','Number six','Number three','Number eight'),
      bankQuestion('Where does the bus leave from?','The station','The market','The hospital'),
      bankQuestion('When does it leave?','At nine','At ten','At eight'),
      bankQuestion('Where can the woman buy a ticket?','At the desk','On the street','In the market')
    ]},
    {audio:'Girl: I want to find the market. Man: Walk along Green Street and turn right at the museum. The market is opposite the park.',questions:[
      bankQuestion('Which street should the girl follow?','Green Street','River Street','Park Street'),
      bankQuestion('Which way should she turn?','Right','Left','Back'),
      bankQuestion('Where should she turn?','At the museum','At the station','At the hospital'),
      bankQuestion('What is opposite the market?','The park','The hospital','The library')
    ]}
  ],reading:[
    {context:'Nina’s aunt drew a map of the town. The library stood next to the hospital, and the market was across from the bus station. Nina took the bus to the market and bought apples.',questions:[
      bankQuestion('Who drew the map?','Nina’s aunt','Nina’s teacher','Nina’s cousin'),
      bankQuestion('What stood next to the hospital?','The library','The market','The station'),
      bankQuestion('What was across from the bus station?','The market','The library','The hospital'),
      bankQuestion('What did Nina buy?','Apples','Tickets','Books')
    ]},
    {context:'At the corner, Omar lost his ticket. A woman found it near the bus stop. He thanked her, then walked to the train station. His train left at eleven.',questions:[
      bankQuestion('What did Omar lose?','His ticket','His map','His schoolbag'),
      bankQuestion('Where was the ticket found?','Near the bus stop','At the market','Inside the train'),
      bankQuestion('Where did Omar walk?','To the train station','To the hospital','To the library'),
      bankQuestion('When did his train leave?','At eleven','At ten','At twelve')
    ]}
  ]},
  5:{listening:[
    {audio:'Girl: The path through the forest is closed today. Boy: Can we walk beside the river instead? Girl: Yes. We might see ducks near the bridge. Boy: I brought a camera.',questions:[
      bankQuestion('Which path is closed?','Through the forest','Beside the river','Up the mountain'),
      bankQuestion('Where can they walk instead?','Beside the river','Across the island','Around the market'),
      bankQuestion('What animals might they see?','Ducks','Dolphins','Insects'),
      bankQuestion('What did the boy bring?','A camera','A map','A bottle')
    ]},
    {audio:'Guide: We will visit the waterfall before lunch. Then we will travel by boat to the island. Child: Will we climb the mountain? Guide: No, it is too far.',questions:[
      bankQuestion('What will they visit first?','The waterfall','The mountain','The island'),
      bankQuestion('When will they visit it?','Before lunch','After lunch','At night'),
      bankQuestion('How will they travel to the island?','By boat','By bus','On foot'),
      bankQuestion('Why will they not climb the mountain?','It is too far','It is closed','It is raining')
    ]}
  ],reading:[
    {context:'Leo visited a forest with his uncle on Saturday. They saw three insects on a green plant. After an hour, they reached a small waterfall. Leo drew it in his notebook.',questions:[
      bankQuestion('Who went with Leo?','His uncle','His father','His cousin'),
      bankQuestion('When did they visit the forest?','On Saturday','On Sunday','On Monday'),
      bankQuestion('How many insects did they see?','Three','Two','Four'),
      bankQuestion('What did Leo draw?','A small waterfall','A green plant','A mountain')
    ]},
    {context:'An island lay off the coast. Mia and her father travelled there by boat. They found bright flowers and watched a dolphin from the shore.',questions:[
      bankQuestion('Where was the island?','Off the coast','In a river','In a forest'),
      bankQuestion('How did Mia travel there?','By boat','By bus','By train'),
      bankQuestion('What did they find?','Bright flowers','A waterfall','A map'),
      bankQuestion('Which animal did they watch?','A dolphin','An insect','A bird')
    ]}
  ]},
  6:{listening:[
    {audio:'Boy: What did you do first yesterday? Girl: I cleaned my room in the morning. After lunch, I visited my aunt. In the evening, I watched a film.',questions:[
      bankQuestion('What did the girl do first?','Cleaned my room','Visited my aunt','Watched a film'),
      bankQuestion('When did she clean her room?','In the morning','After lunch','In the evening'),
      bankQuestion('Who did she visit?','My aunt','My cousin','My teacher'),
      bankQuestion('What did she watch in the evening?','A film','A concert','A game')
    ]},
    {audio:'Father: Tomorrow we will leave at eight. First, feed the cat. Then put your schoolbag in the car. We will arrive before noon.',questions:[
      bankQuestion('When will they leave?','At eight','At nine','At ten'),
      bankQuestion('What should the child feed first?','The cat','The dog','The bird'),
      bankQuestion('Where should the schoolbag go?','In the car','On the bus','At home'),
      bankQuestion('When will they arrive?','Before noon','After lunch','In the evening')
    ]}
  ],reading:[
    {context:'Yesterday, Ben woke at seven. Before breakfast, he watered the plants. He went to school by bus. After school, he helped his mother make dinner.',questions:[
      bankQuestion('When did Ben wake?','At seven','At six','At eight'),
      bankQuestion('What did he do before breakfast?','Watered the plants','Read a book','Fed the cat'),
      bankQuestion('How did he go to school?','By bus','By car','On foot'),
      bankQuestion('Who did he help after school?','His mother','His father','His teacher')
    ]},
    {context:'On Friday morning, Zoe packed her bag for a weekend trip. First, she put in a book. Next, she added a warm jacket. Last, she checked her ticket.',questions:[
      bankQuestion('When did Zoe pack her bag?','Friday morning','Saturday morning','Thursday evening'),
      bankQuestion('What did she put in first?','A book','A jacket','A ticket'),
      bankQuestion('What did she add next?','A warm jacket','A blanket','A map'),
      bankQuestion('What did she check last?','Her ticket','Her book','Her bag')
    ]}
  ]},
  7:{listening:[
    {audio:'Clerk: Your train to Oxford leaves at half past nine from platform four. Girl: Is my suitcase too heavy? Clerk: No, but keep your ticket ready. Girl: I will wait beside the cafe.',questions:[
      bankQuestion('Where is the train going?','To Oxford','To London','To Cambridge'),
      bankQuestion('When does the train leave?','At half past nine','At nine','At half past ten'),
      bankQuestion('Which platform will it use?','Platform four','Platform two','Platform six'),
      bankQuestion('Where will the girl wait?','Beside the cafe','On the train','At the airport')
    ]},
    {audio:'Passenger: My flight was delayed by an hour. Worker: The new departure time is six twenty. Passenger: Where should I leave my luggage? Worker: At desk five.',questions:[
      bankQuestion('What was delayed?','My flight','My train','My bus'),
      bankQuestion('How long was the delay?','An hour','Two hours','Thirty minutes'),
      bankQuestion('What is the new departure time?','Six twenty','Six ten','Seven twenty'),
      bankQuestion('Where should the passenger leave the luggage?','At desk five','At gate five','On platform five')
    ]}
  ],reading:[
    {context:'Emma missed the morning train because she left her ticket at home. Her father brought it to the station. They caught the next train at eleven and arrived in the city before lunch.',questions:[
      bankQuestion('Where had Emma left her ticket?','At home','On the train','In a book'),
      bankQuestion('Who brought the ticket?','Her father','Her cousin','A passenger'),
      bankQuestion('When did they catch the next train?','At eleven','At ten','At noon'),
      bankQuestion('Where did they arrive?','In the city','At the airport','In the village')
    ]},
    {context:'At the airport, Leo watched passengers leave the plane. He carried a green suitcase and waited near gate seven. His cousin arrived from Spain at five o’clock.',questions:[
      bankQuestion('What colour was Leo’s suitcase?','Green','Blue','Black'),
      bankQuestion('Where did Leo wait?','Near gate seven','At desk five','On platform two'),
      bankQuestion('Where had his cousin travelled from?','Spain','France','Italy'),
      bankQuestion('When did his cousin arrive?','At five o’clock','At four o’clock','At six o’clock')
    ]}
  ]},
  8:{listening:[
    {audio:'Nurse: What happened to your knee? Boy: I fell from my bike near the park. Nurse: I will clean it. Please rest for two days.',questions:[
      bankQuestion('Which part of the boy’s body hurts?','Knee','Hand','Head'),
      bankQuestion('What did he fall from?','My bike','A bus','A chair'),
      bankQuestion('Where did he fall?','Near the park','At school','By the river'),
      bankQuestion('How long should he rest?','Two days','One day','Three days')
    ]},
    {audio:'Girl: I have a headache and feel hot. Mother: The thermometer says thirty-eight degrees. We will call the doctor, and you should drink water.',questions:[
      bankQuestion('What does the girl have?','A headache','A toothache','A sore knee'),
      bankQuestion('What is her temperature?','Thirty-eight degrees','Thirty-seven degrees','Thirty-nine degrees'),
      bankQuestion('Who will they call?','The doctor','The dentist','The teacher'),
      bankQuestion('What should the girl drink?','Water','Juice','Milk')
    ]}
  ],reading:[
    {context:'Mia’s dentist checked her teeth on Tuesday. One tooth hurt when she ate cold food. The dentist gave her a small note and asked her to come back next month.',questions:[
      bankQuestion('When did Mia visit the dentist?','Tuesday','Monday','Friday'),
      bankQuestion('What made her tooth hurt?','Cold food','Hot soup','A hard apple'),
      bankQuestion('What did the dentist give Mia?','A small note','Some medicine','A new brush'),
      bankQuestion('When should she return?','Next month','Next week','Tomorrow')
    ]},
    {context:'Tom waited at the clinic with his father. A nurse checked his temperature and said it was normal. Tom’s knee still hurt, so the doctor told him to rest.',questions:[
      bankQuestion('Who waited with Tom?','His father','His mother','His friend'),
      bankQuestion('Who checked his temperature?','A nurse','A dentist','A teacher'),
      bankQuestion('How was Tom’s temperature?','Normal','High','Low'),
      bankQuestion('What did the doctor tell Tom to do?','Rest','Run','Swim')
    ]}
  ]},
  9:{listening:[
    {audio:'Girl: The sky is dark, and I can hear thunder. Boy: Should we leave the park? Girl: Yes, let us go home before the storm. Boy: I will take the blue umbrella.',questions:[
      bankQuestion('What can the girl hear?','Thunder','Music','A bus'),
      bankQuestion('Where are the children?','The park','The school','The beach'),
      bankQuestion('Where will they go?','Home','To the market','To the museum'),
      bankQuestion('What colour is the umbrella?','Blue','Red','Yellow')
    ]},
    {audio:'Teacher: It was foggy at eight, but now the sun is out. The wind will be strong this afternoon. Child: Can we play outside at noon? Teacher: Yes, for a short time.',questions:[
      bankQuestion('When was it foggy?','At eight','At noon','At six'),
      bankQuestion('What is out now?','The sun','The moon','The rainbow'),
      bankQuestion('When will the wind be strong?','This afternoon','This morning','Tonight'),
      bankQuestion('When does the child want to play outside?','At noon','At eight','After dinner')
    ]}
  ],reading:[
    {context:'A rainbow appeared above the school after the rain. The children ran into the garden to see it. Mia counted six colours before a cloud covered the sun.',questions:[
      bankQuestion('Where did the rainbow appear?','Above the school','Above the river','Behind the house'),
      bankQuestion('Where did the children run?','Into the garden','Into the classroom','To the park'),
      bankQuestion('How many colours did Mia count?','Six','Five','Seven'),
      bankQuestion('What covered the sun?','A cloud','A mountain','A tree')
    ]},
    {context:'On Saturday the temperature fell quickly. Ben wore a warm coat and stayed inside until the wind stopped. At sunset, he went to the park with his sister.',questions:[
      bankQuestion('On which day did the temperature fall?','Saturday','Sunday','Friday'),
      bankQuestion('How did the temperature change?','Fell quickly','Rose slowly','Stayed the same'),
      bankQuestion('What did Ben wear?','A warm coat','A light shirt','A rain hat'),
      bankQuestion('When did Ben go to the park?','At sunset','At sunrise','At noon')
    ]}
  ]},
  10:{listening:[
    {audio:'Girl: The concert starts at seven. Will you play the guitar? Boy: No, I will play the violin. Girl: The audience will love it. Boy: I practised for three weeks.',questions:[
      bankQuestion('When does the concert start?','At seven','At six','At eight'),
      bankQuestion('Which instrument will the boy play?','The violin','The guitar','The piano'),
      bankQuestion('Who will listen to the performance?','The audience','The dentist','The passenger'),
      bankQuestion('How long did the boy practise?','Three weeks','Two weeks','Four weeks')
    ]},
    {audio:'Teacher: The competition has five teams. Our team scored nine points in the first round. Student: We should practise tomorrow morning. Teacher: Good idea, meet in the music room.',questions:[
      bankQuestion('How many teams are in the competition?','Five','Four','Six'),
      bankQuestion('How many points did the team score?','Nine','Eight','Ten'),
      bankQuestion('When should the team practise?','Tomorrow morning','This evening','Next week'),
      bankQuestion('Where should they meet?','In the music room','In the classroom','At the museum')
    ]}
  ],reading:[
    {context:'Maya visited the museum before her school concert. She saw an old piano and wrote about it in her notebook. That evening, she performed a new song for her family.',questions:[
      bankQuestion('Where did Maya visit?','The museum','The library','The market'),
      bankQuestion('Which instrument did she see?','An old piano','A new guitar','A small drum'),
      bankQuestion('Where did she write about it?','In her notebook','On a poster','On a ticket'),
      bankQuestion('Who listened to her song?','Her family','Her teacher','Her class')
    ]},
    {context:'Leo entered a dancing competition on Friday. He felt nervous before going on stage. The audience clapped after his performance, and his teacher gave him a medal.',questions:[
      bankQuestion('When was the competition?','Friday','Saturday','Sunday'),
      bankQuestion('How did Leo feel before going on stage?','Nervous','Excited','Angry'),
      bankQuestion('What did the audience do?','Clapped','Sang','Left'),
      bankQuestion('What did his teacher give him?','A medal','A ticket','A book')
    ]}
  ]},
  11:{listening:[
    {audio:'Girl: I found a secret note inside the library book. Boy: What does it say? Girl: Look behind the garden wall at noon. Boy: I will bring a torch.',questions:[
      bankQuestion('Where was the note?','Inside the library book','Under the garden bench','In a suitcase'),
      bankQuestion('Where should they look?','Behind the garden wall','Beside the library door','Under the bed'),
      bankQuestion('When should they look there?','At noon','At nine','At sunset'),
      bankQuestion('What will the boy bring?','A torch','A map','A key')
    ]},
    {audio:'Boy: This unusual box has a blue ribbon. Girl: There is a clue under it. Boy: The clue says to open the box with a silver key. Girl: I saw one in the kitchen.',questions:[
      bankQuestion('What colour is the ribbon?','Blue','Green','Red'),
      bankQuestion('What is under the ribbon?','A clue','A map','A ticket'),
      bankQuestion('What kind of key do they need?','A silver key','A gold key','A small key'),
      bankQuestion('Where did the girl see a key?','In the kitchen','In the garden','In the library')
    ]}
  ],reading:[
    {context:'Zoe discovered a map in her grandfather’s drawer. It showed a small bridge beside the forest. She followed the path and found a wooden box filled with postcards.',questions:[
      bankQuestion('Where did Zoe find the map?','In her grandfather’s drawer','Under a garden bench','Inside a library book'),
      bankQuestion('What did the map show?','A small bridge','A large mountain','An old station'),
      bankQuestion('What was beside the forest?','A small bridge','A waterfall','A school'),
      bankQuestion('What was inside the wooden box?','Postcards','Birthday cards','Tickets')
    ]},
    {context:'Mia was surprised when the lights went out. Suddenly, a tiny bell rang behind the door. Her brother opened it and found a kitten wearing a red collar.',questions:[
      bankQuestion('What happened to the lights?','Went out','Turned blue','Became brighter'),
      bankQuestion('What rang behind the door?','A tiny bell','A telephone','An alarm'),
      bankQuestion('Who opened the door?','Her brother','Her cousin','Her father'),
      bankQuestion('What animal was there?','A kitten','A puppy','A rabbit')
    ]}
  ]},
  12:{listening:[
    {audio:'Girl: Shall we invite our cousins to the picnic on Saturday? Boy: Yes. I will prepare sandwiches, and you can choose the games. Girl: Let us meet near the lake at ten.',questions:[
      bankQuestion('Who will they invite?','Our cousins','Our teachers','Our neighbours'),
      bankQuestion('When is the picnic?','On Saturday','On Sunday','On Friday'),
      bankQuestion('What food will the boy prepare?','Sandwiches','Soup','Fruit salad'),
      bankQuestion('Where will they meet?','Near the lake','At the station','In the garden')
    ]},
    {audio:'Boy: I promised to visit Grandma on Sunday morning. Girl: Can we arrive before lunch? Boy: Yes, the bus leaves at nine. Girl: I will bring her some flowers.',questions:[
      bankQuestion('Who will they visit?','Grandma','Their cousin','Their teacher'),
      bankQuestion('When will they visit her?','Sunday morning','Saturday evening','Monday morning'),
      bankQuestion('When does the bus leave?','At nine','At ten','At eight'),
      bankQuestion('What will the girl bring?','Flowers','Sandwiches','Books')
    ]}
  ],reading:[
    {context:'Anna decided to plan a concert for her friends. She invited four classmates and asked Leo to bring a guitar. The concert began at three in the school hall.',questions:[
      bankQuestion('What did Anna plan?','A concert','A picnic','A race'),
      bankQuestion('How many classmates did she invite?','Four','Three','Five'),
      bankQuestion('What did Leo bring?','A guitar','A violin','A piano'),
      bankQuestion('Where did the concert begin?','In the school hall','At the museum','In the park')
    ]},
    {context:'On Friday, Ben chose a place for his birthday picnic. He wrote invitations and prepared fruit juice. His friends arrived at the park at noon, just before it started to rain.',questions:[
      bankQuestion('When did Ben choose the picnic place?','On Friday','On Saturday','On Sunday'),
      bankQuestion('What did Ben write?','Invitations','Postcards','Stories'),
      bankQuestion('What drink did he prepare?','Fruit juice','Milk','Water'),
      bankQuestion('Where did his friends arrive?','At the park','At the school','At the lake')
    ]}
  ]},
};

