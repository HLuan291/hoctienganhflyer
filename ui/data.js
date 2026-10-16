// Original practice material inspired by the skill types in Cambridge English Young Learners.
// It is not an official Cambridge exam or a reproduction of sample papers.
window.QUEST_PACKS = [
  {
    id: 1, band: 'Movers', title: 'Một ngày ở trường', icon: '🎒', color: '#a78bfa',
    words: [['classroom','phòng học','🏫'],['teacher','giáo viên','👩‍🏫'],['homework','bài tập về nhà','📚'],['library','thư viện','📖'],['schoolbag','cặp sách','🎒'],['lesson','bài học','✏️'],['break','giờ giải lao','🛝'],['board','bảng','🟩']],
    dialogue: 'Girl: Where is my schoolbag? Boy: It is in the library, next to the blue chair. Girl: Thank you! I need it before the lesson starts.',
    listen: [['Where is the schoolbag?','In the library',['In the library','In the classroom','At home']],['What is next to the schoolbag?','A blue chair',['A blue chair','A red table','A green board']],['When does the girl need it?','Before the lesson',['Before the lesson','After school','At break time']]],
    story: 'Mia went to the library before her English lesson. She found her schoolbag next to a blue chair. Inside it, she had her homework and a new book.',
    read: [['Where did Mia go?','The library',['The library','The playground','The kitchen']],['What did Mia find?','Her schoolbag',['Her schoolbag','A ticket','A bottle']],['What was inside the bag?','Homework and a book',['Homework and a book','Food and water','A map and a ticket']]],
    speak: 'Tell a friend where you found your schoolbag. Say where it was and what was inside.',
    model: 'I found my schoolbag in the library. It was next to a blue chair. My homework was inside.'
  },
  {
    id: 2, band: 'Movers', title: 'Ngôi nhà bí mật', icon: '🏠', color: '#f5a66a',
    words: [['kitchen','nhà bếp','🍳'],['bedroom','phòng ngủ','🛏️'],['mirror','gương','🪞'],['sofa','ghế sofa','🛋️'],['blanket','chăn','🧣'],['window','cửa sổ','🪟'],['cousin','anh chị em họ','👧'],['garden','khu vườn','🌻']],
    dialogue: 'Boy: Is your cousin in the garden? Girl: No, she is in the bedroom. She is reading by the window. Boy: I will bring her a blanket.',
    listen: [['Where is the cousin?','In the bedroom',['In the bedroom','In the garden','In the kitchen']],['What is she doing?','Reading',['Reading','Cooking','Sleeping']],['What will the boy bring?','A blanket',['A blanket','A mirror','A sofa']]],
    story: 'Lily visited her cousin on Saturday. They made lunch in the kitchen and ate it in the garden. Later, they sat on the sofa and looked at photos.',
    read: [['Who did Lily visit?','Her cousin',['Her cousin','Her teacher','Her friend']],['Where did they make lunch?','In the kitchen',['In the kitchen','In the bedroom','In the garden']],['What did they look at?','Photos',['Photos','Books','Maps']]],
    speak: 'Describe your favourite room at home. Say what is in it and what you do there.',
    model: 'My favourite room is the kitchen. It has a big window. I make snacks there with my family.'
  },
  {
    id: 3, band: 'Movers', title: 'Chuyến dã ngoại', icon: '🧺', color: '#f2c35e',
    words: [['sandwich','bánh kẹp','🥪'],['bottle','chai','🍼'],['picnic','buổi dã ngoại','🧺'],['hungry','đói','😋'],['thirsty','khát','🥤'],['basket','giỏ','🧺'],['fruit','trái cây','🍎'],['juice','nước ép','🧃']],
    dialogue: 'Girl: I am thirsty. Is there any juice in the basket? Boy: Yes, there is one bottle. I also brought two sandwiches and some fruit.',
    listen: [['How does the girl feel?','Thirsty',['Thirsty','Hungry','Tired']],['Where is the juice?','In the basket',['In the basket','In the car','On the table']],['How many sandwiches did the boy bring?','Two',['Two','One','Three']]],
    story: 'Ben and Ava had a picnic near the river. Ava brought fruit and juice. Ben made two sandwiches. They shared the food and played a game after lunch.',
    read: [['Where was the picnic?','Near the river',['Near the river','At school','On a bus']],['Who brought the fruit?','Ava',['Ava','Ben','Mia']],['What did they do after lunch?','Played a game',['Played a game','Went shopping','Read a book']]],
    speak: 'Plan a picnic. Say where you will go and what food you will bring.',
    model: 'I will have a picnic by the river. I will bring sandwiches, fruit and some juice.'
  },
  {
    id: 4, band: 'Movers', title: 'Tìm đường trong phố', icon: '🗺️', color: '#6fc5bc',
    words: [['street','đường phố','🛣️'],['station','nhà ga','🚉'],['hospital','bệnh viện','🏥'],['market','chợ','🛍️'],['ticket','vé','🎟️'],['map','bản đồ','🗺️'],['corner','góc đường','↪️'],['bus','xe buýt','🚌']],
    dialogue: 'Woman: How can I get to the station? Boy: Walk along this street and turn left at the market. The station is next to the hospital.',
    listen: [['Where does the woman want to go?','The station',['The station','The hospital','The market']],['Where should she turn left?','At the market',['At the market','At the hospital','At the school']],['What is next to the station?','The hospital',['The hospital','The library','The park']]],
    story: 'Nina looked at a map before taking the bus. She bought a ticket at the station. Then she met her aunt outside the market.',
    read: [['What did Nina look at?','A map',['A map','A book','A picture']],['Where did she buy a ticket?','At the station',['At the station','At the market','At school']],['Who did she meet?','Her aunt',['Her aunt','Her teacher','Her cousin']]],
    speak: 'Give directions from your school to a place near it. Use left, right or next to.',
    model: 'Walk along the street and turn right. The library is next to the park.'
  },
  {
    id: 5, band: 'Movers', title: 'Thế giới thiên nhiên', icon: '🌿', color: '#7ecf8d',
    words: [['river','dòng sông','🏞️'],['forest','khu rừng','🌲'],['mountain','ngọn núi','⛰️'],['island','hòn đảo','🏝️'],['dolphin','cá heo','🐬'],['insect','côn trùng','🐞'],['plant','cây cối','🌱'],['waterfall','thác nước','💦']],
    dialogue: 'Girl: Did you see a dolphin near the island? Boy: Yes! We also walked through the forest and found a small waterfall.',
    listen: [['What animal did they see?','A dolphin',['A dolphin','An insect','A bird']],['Where was it?','Near the island',['Near the island','On the mountain','In the forest']],['What did they find in the forest?','A waterfall',['A waterfall','A station','A garden']]],
    story: 'On Sunday, Leo walked with his family through a forest. They saw insects on the plants and reached a waterfall. They took photos before going home.',
    read: [['When did Leo go to the forest?','On Sunday',['On Sunday','On Monday','On Friday']],['What did they see on the plants?','Insects',['Insects','Dolphins','Fish']],['What did they do at the waterfall?','Took photos',['Took photos','Had dinner','Bought tickets']]],
    speak: 'Describe a place in nature that you would like to visit. Say what you might see there.',
    model: 'I would like to visit an island. I might see dolphins and beautiful plants.'
  },
  {
    id: 6, band: 'Movers', title: 'Ngày hôm qua', icon: '🕰️', color: '#e5a0aa',
    words: [['yesterday','hôm qua','⏮️'],['tomorrow','ngày mai','⏭️'],['morning','buổi sáng','🌅'],['evening','buổi tối','🌙'],['first','đầu tiên','🥇'],['last','cuối cùng','🏁'],['before','trước khi','⬅️'],['after','sau khi','➡️']],
    dialogue: 'Boy: What did you do yesterday morning? Girl: First I finished my homework. After lunch, I visited my grandmother. Tomorrow I will see her again.',
    listen: [['When did the girl finish her homework?','Yesterday morning',['Yesterday morning','Yesterday evening','Tomorrow morning']],['Who did she visit?','Her grandmother',['Her grandmother','Her teacher','Her cousin']],['When will she see her again?','Tomorrow',['Tomorrow','Tonight','Next month']]],
    story: 'Yesterday, Sam woke up early. Before school, he fed his cat. After school, he played football. In the evening, he read a story and went to bed.',
    read: [['When did Sam feed his cat?','Before school',['Before school','After school','In the evening']],['What did he do after school?','Played football',['Played football','Read a story','Made lunch']],['What did he do in the evening?','Read a story',['Read a story','Went swimming','Visited a friend']]],
    speak: 'Tell a short story about yesterday. Say what you did first, next and last.',
    model: 'Yesterday I went to school. First, I had English. Next, I played with my friends. Last, I went home.'
  },
  {
    id: 7, band: 'Flyers', title: 'Chuyến đi bất ngờ', icon: '✈️', color: '#9c8bf3',
    words: [['journey','chuyến đi','🚆'],['airport','sân bay','✈️'],['luggage','hành lý','🧳'],['passenger','hành khách','🧍'],['suitcase','vali','🧳'],['arrive','đến nơi','📍'],['leave','rời đi','🚶'],['platform','sân ga','🚉']],
    dialogue: 'Girl: When will the train leave? Man: At ten fifteen from platform two. Girl: Oh no, my suitcase is still in the waiting room! Man: Hurry, but take your ticket.',
    listen: [['When will the train leave?','At ten fifteen',['At ten fifteen','At ten thirty','At nine fifteen']],['Which platform?','Platform two',['Platform two','Platform one','Platform three']],['Where is the suitcase?','In the waiting room',['In the waiting room','On the train','At the airport']]],
    story: 'Emma arrived at the station early, but she could not find her ticket. A kind passenger helped her look through her luggage. They found it inside a small book.',
    read: [['What could Emma not find?','Her ticket',['Her ticket','Her suitcase','Her phone']],['Who helped her?','A passenger',['A passenger','A teacher','A doctor']],['Where was the ticket?','Inside a book',['Inside a book','Under a chair','On the platform']]],
    speak: 'Tell a story about a journey. Explain where you went, what happened and how you felt.',
    model: 'I went on a journey by train. I left my suitcase in the waiting room, but I found it before the train left.'
  },
  {
    id: 8, band: 'Flyers', title: 'Phòng khám vui vẻ', icon: '🩺', color: '#f29e9e',
    words: [['accident','tai nạn','🩹'],['ambulance','xe cứu thương','🚑'],['dentist','nha sĩ','🦷'],['medicine','thuốc','💊'],['headache','đau đầu','🤕'],['temperature','nhiệt độ','🌡️'],['healthy','khỏe mạnh','💪'],['patient','bệnh nhân','🧑‍⚕️']],
    dialogue: 'Mother: Why did you stay home today? Girl: I had a headache and a high temperature. The doctor said I should rest and drink water.',
    listen: [['Why did the girl stay home?','She felt ill',['She felt ill','It was raining','She missed the bus']],['What was high?','Her temperature',['Her temperature','Her score','The price']],['What did the doctor suggest?','Rest and drink water',['Rest and drink water','Play football','Eat sweets']]],
    story: 'Tom fell while riding his bike. His knee hurt, so his father took him to the clinic. The nurse cleaned it and told Tom to rest. The next day, he felt better.',
    read: [['How did Tom hurt his knee?','He fell from his bike',['He fell from his bike','He played tennis','He went swimming']],['Who cleaned his knee?','The nurse',['The nurse','The dentist','His friend']],['How did he feel the next day?','Better',['Better','Worse','Hungry']]],
    speak: 'Explain to a doctor how you feel and ask what you should do.',
    model: 'I have a headache and I feel tired. What should I do?'
  },
  {
    id: 9, band: 'Flyers', title: 'Bí mật của thời tiết', icon: '🌦️', color: '#65b8c4',
    words: [['storm','cơn bão','⛈️'],['foggy','có sương mù','🌫️'],['temperature','nhiệt độ','🌡️'],['cloud','đám mây','☁️'],['rainbow','cầu vồng','🌈'],['lightning','tia chớp','⚡'],['weather','thời tiết','🌤️'],['windy','có gió','💨']],
    dialogue: 'Boy: Shall we play outside? Girl: Not yet. Dark clouds are coming and I can see lightning. Boy: Then let us wait until the storm has passed.',
    listen: [['What can the girl see?','Lightning',['Lightning','A rainbow','Snow']],['What is coming?','Dark clouds',['Dark clouds','A bus','A train']],['What will they do?','Wait inside',['Wait inside','Play outside now','Go to the beach']]],
    story: 'The morning was foggy, so the children stayed near the house. After lunch, the wind stopped and the sun appeared. They saw a rainbow above the garden.',
    read: [['What was the morning like?','Foggy',['Foggy','Hot','Snowy']],['When did the wind stop?','After lunch',['After lunch','Before breakfast','At night']],['Where was the rainbow?','Above the garden',['Above the garden','Above the school','Above the river']]],
    speak: 'Compare the weather yesterday and today. Say what you could or could not do.',
    model: 'Yesterday it was stormy, so I stayed inside. Today it is sunny, and I can play outside.'
  },
  {
    id: 10, band: 'Flyers', title: 'Sân khấu tài năng', icon: '🎭', color: '#efa867',
    words: [['competition','cuộc thi','🏆'],['score','điểm số','🔢'],['practice','luyện tập','🎯'],['instrument','nhạc cụ','🎸'],['concert','buổi hòa nhạc','🎵'],['museum','bảo tàng','🏛️'],['perform','biểu diễn','🎤'],['audience','khán giả','👥']],
    dialogue: 'Girl: Are you ready for the concert? Boy: Almost. I have practised the guitar every evening. Girl: Great! The audience will enjoy your song.',
    listen: [['What will the boy play?','The guitar',['The guitar','The piano','The drums']],['How often has he practised?','Every evening',['Every evening','Every morning','Once a week']],['Who will enjoy the song?','The audience',['The audience','The teacher','The dentist']]],
    story: 'Maya entered a music competition. She practised her instrument for two weeks. At the concert, she felt nervous at first, but the audience smiled and she played well.',
    read: [['What did Maya enter?','A music competition',['A music competition','A sports race','An art class']],['How long did she practise?','Two weeks',['Two weeks','Two days','Two months']],['How did she feel at first?','Nervous',['Nervous','Angry','Hungry']]],
    speak: 'Tell a friend about a show or competition. Say what happened and how someone felt.',
    model: 'I performed in a concert. I felt nervous at first, but the audience smiled and I felt happy.'
  },
  {
    id: 11, band: 'Flyers', title: 'Vụ án chiếc hộp', icon: '🔎', color: '#9eac77',
    words: [['discover','khám phá ra','🔍'],['suddenly','đột nhiên','⚡'],['excited','hào hứng','🤩'],['surprised','ngạc nhiên','😮'],['unusual','khác thường','✨'],['adventure','cuộc phiêu lưu','🧭'],['secret','bí mật','🔐'],['clue','manh mối','🧩']],
    dialogue: 'Boy: I found an unusual box behind the tree. Girl: Is there a clue inside? Boy: Yes, there is a small map! Suddenly, this feels like an adventure.',
    listen: [['Where was the box?','Behind the tree',['Behind the tree','Under the table','In the library']],['What was inside?','A small map',['A small map','A ticket','A photo']],['How did the boy describe the box?','Unusual',['Unusual','Heavy','Blue']]],
    story: 'Zoe discovered a secret note in an old book. It told her to look under the garden bench. She found a small box there and was surprised to see birthday cards from her friends.',
    read: [['Where did Zoe find the note?','In an old book',['In an old book','Under a bench','At school']],['Where did the note send her?','Under the garden bench',['Under the garden bench','To the kitchen','To the station']],['What was in the box?','Birthday cards',['Birthday cards','A map','A camera']]],
    speak: 'Continue this story: You discover a secret note in a book. What happens next?',
    model: 'I discovered a secret note in a book. It led me to the garden. Suddenly, I found a box with a surprise inside.'
  },
  {
    id: 12, band: 'Flyers', title: 'Kế hoạch cuối tuần', icon: '📅', color: '#d798b4',
    words: [['decide','quyết định','✅'],['invite','mời','💌'],['prepare','chuẩn bị','📝'],['promise','hứa','🤝'],['visit','ghé thăm','🚪'],['arrive','đến nơi','📍'],['choose','lựa chọn','🔀'],['plan','kế hoạch','📅']],
    dialogue: 'Girl: Have you decided what to do on Saturday? Boy: I will invite my cousins to visit. We should prepare some games before they arrive.',
    listen: [['When will the cousins visit?','On Saturday',['On Saturday','On Sunday','On Friday']],['Who will the boy invite?','His cousins',['His cousins','His teachers','His neighbours']],['What will they prepare?','Some games',['Some games','A concert','A map']]],
    story: 'Anna decided to invite her friends to a picnic. She prepared sandwiches and chose a place near the lake. Her friends arrived at noon, and they all enjoyed the afternoon.',
    read: [['What did Anna plan?','A picnic',['A picnic','A concert','A lesson']],['Where did they go?','Near the lake',['Near the lake','To the museum','To the airport']],['When did her friends arrive?','At noon',['At noon','In the evening','Early morning']]],
    speak: 'Make a weekend plan with a friend. Ask what they want to do, then explain your plan.',
    model: 'What would you like to do on Saturday? We could have a picnic near the lake. I will prepare sandwiches.'
  }
];

window.QUEST_TRACKS = [
  { id:'vocab', name:'Từ vựng', icon:'✦', color:'#a779ea', subtitle:'Nhớ và dùng từ' },
  { id:'listening', name:'Nghe', icon:'◉', color:'#4da9c5', subtitle:'Nghe tìm thông tin' },
  { id:'reading', name:'Đọc', icon:'▤', color:'#e8a447', subtitle:'Đọc hiểu câu chuyện' },
  { id:'writing', name:'Viết', icon:'✎', color:'#ed849d', subtitle:'Viết đúng và rõ' },
  { id:'speaking', name:'Nói', icon:'◌', color:'#76ad7e', subtitle:'Tự tin diễn đạt' }
];

