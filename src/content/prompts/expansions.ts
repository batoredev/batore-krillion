// Hand-researched extra accepted answers for prompts where Wikidata coverage is thin.
// Same format as the prompt files: ";" between answers, "|" between spellings. Merged without duplicates.
import type { TierKey } from "@/game/tiers";
type Extra = Partial<Record<Exclude<TierKey, "gem">, string>>;

export const EXPANSIONS: Record<string, Extra> = {
  "ic-punjabi": {
    orbit: "Chicken curry; Mutton curry; Keema; Pindi chana; Aloo paratha; Gobi paratha; Mooli paratha; Paneer paratha; Kadhi; Jeera rice; Butter naan; Tandoori chicken; Sarson da saag; Rajma masala; Chole kulche; Amritsari kulcha; Lassi; Chaas",
    moonshot: "Chicken tikka masala; Achari paneer; Paneer bhurji; Aloo methi; Bhindi do pyaza; Baingan bharta; Dal tadka; Matar paneer; Malai kofta; Shahi paneer; Kadai chicken; Chicken changezi; Pinni; Panjiri; Gajrela|gajar ka halwa; Phirni; Kheer; Malpua; Jalebi; Patiala chicken; Amritsari machhi; Tawa chicken; Chicken lababdar",
    deep: "Tariwala chicken; Dhaba chicken; Bhuna gosht; Mah di dal; Kali dal; Saag gosht; Meat pulao; Kadhi chawal; Rajma chawal; Atte da halwa; Karah prasad; Gur ka halwa; Makki di roti; Missi roti; Tandoori roti; Lachha paratha; Bhature; Pakoras; Gobhi aloo; Pindi chole; Paneer tikka; Fish tikka; Mutton seekh; Shakkar para; Mathri; Langar dal; Dahi bhalle; Kanji vada",
  },
  "ic-hyderabadi": {
    orbit: "Kacchi biryani; Pakki biryani; Mutton biryani; Chicken biryani; Hyderabadi haleem; Mirchi bajji; Kheema; Dalcha; Khubani ka meetha; Sheer korma",
    moonshot: "Chicken 65; Mutton marag; Paya; Lukhmi; Tala hua gosht; Kalyani biryani; Dum ka murgh; Murgh do pyaza; Shikampuri kebab; Pathar ka gosht; Bagara khana|bagara rice; Khatti dal; Tamatar ka kut; Bhuna gosht; Nihari kulcha; Irani samosa; Osmania biscuit; Fine biscuits; Dil kush; Lukhmi",
    deep: "Khagina; Shahi tukda; Gil-e-firdaus; Badam ki jali; Ande ka halwa; Kaddu ki kheer; Zafrani pulao; Mutton dalcha; Chakna; Kaleji fry; Talawa gosht; Achari gosht; Dum ka keema; Hyderabadi kofta; Baingan ka salan; Bagare baingan; Tamatar ki chutney; Pootharekulu",
  },
  "ic-goan": {
    orbit: "Fish curry rice; Prawn curry; Prawn balchao; Chicken xacuti; Mutton xacuti; Pork vindaloo; Chicken cafreal; Sorpotel; Bebinca; Goan sausage; Pao; Poi; Ros omelette; Rava fish fry; Crab xec xec; Feni",
    moonshot: "Ambot tik; Recheado; Kingfish recheado; Mackerel recheado; Caldine|fish caldine; Prawn caldine; Sannas; Patoleo; Dodol; Bolinhas; Serradura; Kulkuls; Neureos; Bath cake; Perad; Doce; Chicken cafreal; Choris pao; Bhaji pao; Khatkhate; Tonak; Sol kadi; Udid methi; Mushroom xacuti",
    deep: "Arroz refogado; Galinha cafreal; Cabidela; Assado; Rissois; Croquettes; Empadinhas; Pez|pej; Kismur; Hooman; Sungtache hooman; Tisreo sukhem; Kalwanchi bhaji; Mangane; Shevyo; Godshe; Alle belle; Kokad; Pinagre",
  },
  "ic-kashmiri": {
    orbit: "Rogan josh; Yakhni; Gushtaba; Rista; Dum aloo; Kashmiri pulao; Modur pulao; Haak; Nadru; Kahwa; Noon chai; Tabak maaz; Kashmiri chicken",
    moonshot: "Aab gosh; Methi maaz; Marchwangan korma; Kanti; Seekh kebab; Waza kokur; Kokur yakhni; Nadru yakhni; Nadru monje; Monje haakh; Chaman qaliya; Lyodur tschaman; Matschgand; Kabargah; Tujj; Harissa; Girda; Bakarkhani; Kulcha; Lavasa; Shufta; Phirni; Sheer chai",
    deep: "Daniwal korma; Dhaniwal korma; Al yakhni; Ruwangan chaman; Chok wangun; Hokh syun; Gogji raajma; Muj chetin; Babribyol; Kalari; Kongposh; Tsochwor; Kashir rajma; Hakh; Kanguch|gucchi; Gucchi pulao; Wazwan; Tabakh maaz",
  },
  "ic-odia": {
    orbit: "Pakhala; Dalma; Chhena poda; Rasagola; Rasabali; Chhena gaja; Machha besara; Santula; Dahibara aloo dum; Chakuli pitha; Arisa pitha; Khira sagara",
    moonshot: "Chhena jhili; Manda pitha; Enduri pitha; Kakara pitha; Poda pitha; Chungdi malai; Kanika; Ghanta tarkari; Saga bhaja; Badi chura; Machha ghanta; Chingudi jhola; Kankada jhola; Mansa tarkari; Gupchup; Bara ghuguni; Khaja; Magaja ladoo; Khechudi",
    deep: "Hendua pitha; Mitha dali; Mandia pitha; Kalara chhuin; Poi saga; Kakharu phula bhaja; Chhatu tarkari; Kora khai; Gaja; Chhena murki; Pheni; Rasakadamba; Kheersagar; Chuna machha; Dahi baigana; Sajana chhuin; Leutia saga; Kosala saga; Dhoka; Aloo potala rasa; Besara; Abadha",
  },
  "ic-northeast": {
    orbit: "Momos; Thukpa; Masor tenga; Khar; Pitha; Jadoh; Eromba; Singju; Axone; Smoked pork; Bamboo shoot curry; Aloo pitika; Duck curry; Pork with bamboo shoot; Bhut jolokia chutney; Chak-hao kheer",
    moonshot: "Doh khlieh; Tungrymbai; Nakham bitchi; Bai; Sanpiau; Vawksa rep; Galho; Zutho; Apong; Kangshoi; Nga thongba; Morok metpa; Paknam; Ooti; Kelli chana; Sel roti; Gundruk; Sinki; Kinema; Phagshapa; Sha phaley; Chhurpi; Ningro curry; Mui borok; Berma; Chakhwi; Gudok; Wahan mosdeng; Pura mach; Lukter; Pehak",
    deep: "Pumaloi; Pukhlein; Dohjem; Jadoh snam; Ja stem; Tit; Arsa bilai; Panch phoron; Koat pitha; Til pitha; Narikol laru; Ghila pitha; Hukoti; Tenga; Patot diya mach; Hahor mangxo; Kumol saul; Xaak bhaji; Lai xaak; Bor; Chamthong; Yongchak singju; Ngari; Utti; Hinchak; Akhuni; Anishi; Galho; Kholar",
  },
  "ic-tamil": {
    orbit: "Idli; Dosa; Sambar; Rasam; Pongal; Chettinad chicken; Kothu parotta; Curd rice; Lemon rice; Puliyodarai; Medu vada; Kuzhi paniyaram; Appam; Idiyappam; Filter coffee; Payasam; Mysore pak; Jigarthanda; Kozhukattai",
    moonshot: "Chicken Chettinad; Mutton Chettinad; Chettinad pepper chicken; Nattu kozhi curry; Meen kuzhambu; Vatha kuzhambu; Mor kuzhambu; Kara kuzhambu; Poriyal; Kootu; Avial; Adai; Rava dosa; Ghee roast; Kari dosai; Muttai parotta; Bun parotta; Kalakki; Nethili fry; Eral thokku; Sundal; Murukku; Thattai; Adhirasam; Palkova; Tirunelveli halwa; Sakkarai pongal; Ven pongal",
    deep: "Kambu koozh; Ragi koozh; Keerai masiyal; Paruppu usili; Milagu rasam; Thakkali rasam; Kollu rasam; Vendhaya kali; Ulundhu kali; Kavuni arisi; Pallipalayam chicken; Kongunadu chicken; Chicken uppu kari; Kudal kari; Ayira meen kuzhambu; Sura puttu; Nandu masala; Kola urundai; Salna; Kuruma; Elaneer payasam; Karupatti paniyaram; Pirandai thuvaiyal; Thinai pongal; Mappillai samba",
  },
  "ic-andhra": {
    orbit: "Pesarattu; Pulihora; Gongura pickle; Gongura mutton; Avakaya; Andhra chicken curry; Chepala pulusu; Royyala iguru; Gutti vankaya; Pappu; Majjiga pulusu; Mirchi bajji; Punugulu; Pootharekulu; Bobbatlu; Ariselu; Kakinada kaja; Haleem; Hyderabadi biryani",
    moonshot: "Natu kodi pulusu; Ulavacharu; Pachi pulusu; Tomato pappu; Mamidikaya pappu; Dondakaya fry; Bendakaya fry; Kanda bachali; Sakinalu; Sarva pindi; Jonna rotte; Ragi sangati; Bagara annam; Chegodilu; Garelu; Mudda pappu; Allam pachadi; Pachi mirchi pachadi; Kodi kura; Upma pesarattu; Bandar laddu; Double ka meetha; Qubani ka meetha; Rava kesari",
    deep: "Bongu chicken|bamboo chicken; Konaseema royyala; Atreyapuram pootharekulu; Palakova; Bellam paramannam; Chalimidi; Kudumulu; Pala thalikalu; Ponganalu; Kandi podi; Nalla karam; Karam podi; Ullikaram; Pesara pappu payasam; Gongura pachadi; Pulusu; Talimpu; Annam; Perugu pachadi; Sunnundalu; Boorelu; Jantikalu",
  },
  "ic-bihar-up": {
    orbit: "Litti chokha; Sattu paratha; Thekua; Khaja; Champaran mutton|ahuna mutton; Galouti kebab; Tunday kebab; Lucknowi biryani; Petha; Bedmi puri; Kachori sabzi; Aloo tikki; Malpua; Rabri; Peda",
    moonshot: "Dal pitha; Chana ghugni; Sattu sharbat; Basket chaat; Nihari; Sheermal; Kulfi faluda; Malai makhan; Banarasi paan; Tamatar chaat; Khurchan; Imarti; Dahi chura; Tilkut; Anarsa; Balushahi; Parwal ki mithai; Laung lata; Kadhi badi; Chokha; Bihari kebab; Pua; Nimona; Tehri; Kakori kebab; Warqi paratha; Shahi tukda; Mathura peda; Agra petha",
    deep: "Makhana kheer; Chandrakala; Khurma; Pedakiya; Bagiya; Dhuska; Rugda; Kesaria; Rasiao; Shakarkand chaat; Daulat ki chaat; Malaiyyo; Sohan halwa; Gilauri paan; Kundan kaliya; Lal peda; Khasta kachori; Baati chokha; Litti; Sattu; Silao khaja; Belgrami; Lavang lata",
  },
  "ic-parsi-sindhi": {
    orbit: "Dhansak; Patra ni machhi; Sali boti; Akuri; Sindhi kadhi; Dal pakwan; Sai bhaji; Koki; Sindhi biryani; Lagan nu custard; Berry pulao; Falooda; Bun maska; Irani chai",
    moonshot: "Sali par eedu; Mutton pulao dal; Ravo; Parsi sev; Chicken farcha; Kolmi no patio; Bheeda par eedu; Kheema pao; Dar ni pori; Malido; Bhakra; Kumas; Mawa ni boi; Saas ni machhi; Patrel; Seyal phulka; Aloo tuk; Bhuga chawal; Sindhi tidali dal; Kheerni; Satpura; Ghiyar",
    deep: "Kharu gosh; Tarapori patio; Jardaloo boti; Khattu mitthu; Lagan nu stew; Masoor ma gosh; Sev ganthia; Doodh pak; Mitho lolo; Pallo machhi; Seyal mani; Kokee; Dodo; Thadal; Sanna pakoda; Singhar ji bhaji; Taryal patata; Lolo; Bhee patata; Vengna nu bharthu",
  },
  "ic-biryani": {
    orbit: "Veg biryani; Egg biryani; Prawn biryani; Fish biryani; Mutton biryani; Chicken biryani; Kolkata biryani; Lucknowi biryani; Malabar biryani; Thalassery biryani; Dindigul biryani; Ambur biryani; Sindhi biryani; Bombay biryani; Kacchi biryani; Dum biryani; Paneer biryani",
    moonshot: "Chettinad biryani; Memoni biryani; Bhatkali biryani; Donne biryani; Kalyani biryani; Beary biryani; Tahari; Mughlai biryani; Delhi biryani; Moradabadi biryani; Rampuri biryani; Arcot biryani; Vaniyambadi biryani; Salem biryani; Coimbatore biryani; Avakai biryani; Gongura biryani; Ulavacharu biryani; Mushroom biryani; Keema biryani; Kofta biryani; Afghani biryani",
    deep: "Doodh biryani; Kampuri biryani; Bohri biryani; Sufiyani biryani; Zafrani biryani; Kutchi biryani; Rawther biryani; Thalappakatti biryani; Seeraga samba biryani; Nawabi biryani; Kappa biryani; Mandi biryani; Boneless biryani; Hyderabadi zafrani; Pulao biryani; Yakhni biryani; Lamb biryani; Duck biryani",
  },
  "ic-dosa": {
    orbit: "Masala dosa; Plain dosa; Rava dosa; Mysore masala dosa; Paper dosa; Onion dosa; Set dosa; Neer dosa; Benne dosa; Ghee roast dosa; Cheese dosa; Paneer dosa; Pesarattu; Adai; Ragi dosa; Uttapam; Egg dosa",
    moonshot: "Spring dosa; Oats dosa; Kal dosa; Podi dosa; Butter dosa; Schezwan dosa; Pav bhaji dosa; Kari dosa; Godhuma dosa; Moong dal dosa; Jini dosa; Open dosa; Cone dosa; Family dosa; Gunpowder dosa; Kara dosa; Mysore dosa; Paneer chilli dosa; Rava masala dosa; Onion rava dosa",
    deep: "Thatte dosa; Muttai kari dosa; Ural dosa; Nool dosa; Kuzhi dosa; Paddu; Chattambade; Moru dosa; Kambu dosa; Thinai dosa; Kollu dosa; Ragi rava dosa; Bun dosa; 70mm dosa; Topi dosa; Dosakaaya dosa; Sannas; Appam; Pathiri; Davangere benne dosa; Mangalore dosa; Masala neer dosa",
  },
  "ic-dal": {
    orbit: "Dal tadka; Dal makhani; Dal fry; Sambar; Rajma; Chana dal; Moong dal; Masoor dal; Toor dal; Arhar dal; Urad dal; Dal palak; Panchmel dal; Dal baati; Kadhi; Chole; Cholar dal; Varan; Amti; Rasam; Dalma; Khichdi; Mixed dal; Dal khichdi",
    moonshot: "Dal gosht; Dal pakwan; Gujarati dal; Khatti dal; Dalcha; Kootu; Paruppu usili; Sindhi dal; Langar dal; Maa ki dal; Kulith saar; Matki usal; Dal dhokli; Tamatar pappu; Mamidikaya pappu; Gongura pappu; Ghugni; Pappu; Paruppu; Dal tadka (dhaba)|dhaba dal; Lasooni dal; Kali dal; Chana masala",
    deep: "Dal pithi; Dal ki dulhan; Mangodi; Badi; Bori; Kulthi dal; Bhatt ki churkani; Chainsoo; Gahat ki dal; Sukhi urad dal; Maa chole di dal; Mah ki dal; Dal kachori; Dal puri; Dal bafla; Chana dal halwa; Moong dal halwa; Dal moth; Rasam vada; Pitla; Zunka; Besan kadhi",
  },
  "ic-paneer": {
    orbit: "Paneer butter masala; Palak paneer; Shahi paneer; Kadai paneer; Paneer tikka; Matar paneer; Paneer bhurji; Paneer pakora; Chilli paneer; Paneer lababdar; Paneer do pyaza; Malai kofta; Paneer kofta; Paneer paratha; Paneer tikka masala; Achari paneer; Paneer makhani; Paneer jalfrezi",
    moonshot: "Paneer 65; Paneer roll; Paneer sandwich; Methi malai paneer; Paneer korma; Paneer biryani; Paneer pulao; Paneer pasanda; Paneer Kolhapuri; Paneer Chettinad; Paneer khurchan; Paneer angara; Paneer Afghani; Paneer malai tikka; Paneer Manchurian; Paneer fried rice; Paneer momos; Kalakand; Rasmalai; Paneer kheer; Paneer kathi roll; Paneer burji pav|paneer bhurji pav",
    deep: "Paneer tamatar; Paneer rezala; Paneer kaliya; Paneer Patiala; Paneer Peshawari; Paneer shashlik; Paneer pinwheel; Paneer nugget; Dhaba paneer; Paneer methi; Paneer mirch; Paneer pudina tikka; Chhena poda; Chhena jalebi; Sandesh; Paneer jalebi; Paneer cheela; Paneer capsicum; Paneer bhaji; Paneer kurma",
  },
  "ic-street": {
    moonshot: "Kulcha chole; Ram ladoo; Moong dal pakoda; Chole tikki; Aloo chaat; Fruit chaat; Corn chaat; Sev puri; Dahi puri; Masala puri; Churumuri; Girmit; Mirchi bajji; Gobi manchurian; Egg bhurji pav; Anda bhurji; Bread omelette; Maggi; Masala corn; Kebab roll; Shawarma roll; Chicken roll; Egg roll; Veg frankie; Chowmein; Momos; Fried momos; Tandoori momos; Kathi roll; Puchka; Jhalmuri; Ghugni; Churmur; Phuchka",
    deep: "Gupchup; Dahibara aloodum; Bhaji pav; Usal pav; Kanda poha; Sabudana vada; Batata vada; Bhakarwadi; Dabeli; Khaman; Locho; Sev usal; Kachori (pyaaz)|pyaaz kachori; Mirchi vada; Kalmi vada; Daulat ki chaat; Malaiyo; Kanji vada; Tamatar chaat; Bhutte ka kees; Poha jalebi; Chhole kulche; Ram laddoo; Matar kulcha; Aloo kabli; Dimer devil|egg devil; Kabiraji|chicken kabiraji; Telebhaja; Beguni",
  },
  "ic-bread": {
    moonshot: "Tandoori naan; Butter naan; Garlic naan; Cheese naan; Keema naan; Kashmiri naan; Peshwari naan; Amritsari kulcha; Paneer kulcha; Aloo kulcha; Methi thepla; Gobi paratha; Paneer paratha; Mooli paratha; Methi paratha; Lachha paratha; Malabar parotta; Kerala parotta; Ceylon parotta|veechu parotta; Rumali roti; Roomali roti; Tandoori roti; Phulka; Puri; Bhatura; Luchi; Radhaballavi; Kachori; Thepla; Bhakri; Thalipeeth; Rotla; Missi roti",
    deep: "Ulli roti; Kuboos; Pathiri; Ari pathiri; Neypathiri; Mandige; Holige; Pathir; Chilra; Tchot; Lavasa; Sheermal; Bakarkhani; Taftan; Girda; Kulcha; Dhebra; Bhakhri; Poee; Pao; Kakra pitha; Bedvi puri; Akki rotti; Ragi rotti; Jolada rotti; Makki ki roti; Bajra roti; Jowar roti; Nachni bhakri; Koki; Sel roti; Babru; Siddu; Khambir; Tingmo",
  },
  "ic-gujarati": {
    moonshot: "Thepla; Khaman dhokla; Rava dhokla; Sev khamani; Undhiyu; Handvo; Khandvi; Patra; Fafda; Jalebi fafda; Muthiya; Dal dhokli; Khichdi kadhi; Gujarati kadhi; Ringan no olo; Lilva kachori; Dabeli; Sev tameta nu shaak; Bhakri; Rotla; Basundi; Shrikhand; Mohanthal; Ghari; Sutarfeni; Sukhdi; Doodhpak; Kansar; Dal baati churma; Gatte ki sabzi; Ker sangri; Laal maas; Ghevar; Pyaaz kachori; Mirchi vada; Bajre ki roti; Malpua; Mawa kachori",
    deep: "Ponk; Locho; Sev usal; Khichu; Khakhra; Gathiya; Chorafali; Panki; Halwasan; Khatta dhokla; Nylon khaman; Tam tam; Dudhi muthiya; Khatiyu; Lapsi; Churma ladoo; Bajre ka khichda; Bajre ki rabdi; Safed maas; Jungli maas; Mohan maas; Kair kumatiya; Panchkuta; Govind gatte; Raab; Khoba roti; Bafla; Papad ki sabzi; Gulab jamun ki sabzi; Dahi tikhari; Bharela ringan",
  },
  "ic-maharashtrian": {
    moonshot: "Vada pav; Misal pav; Pav bhaji; Puran poli; Modak; Kanda poha; Sabudana khichdi; Thalipeeth; Zunka bhakar; Pithla bhakri; Bharli vangi; Kolhapuri misal; Tambda rassa; Pandhra rassa; Shrikhand; Basundi; Solkadhi; Kothimbir vadi; Alu vadi; Batata vada; Sheera; Bombil fry; Kombdi vade; Usal; Bhakarwadi; Chakli; Shankarpali; Karanji; Amti; Varan bhaat; Masale bhaat; Mutton sukka; Saoji chicken; Matki usal",
    deep: "Patodi; Varhadi mutton; Mirchi thecha; Khandeshi shev bhaji; Dadpe pohe; Ghavan; Amboli; Kharvas; Anarsa; Chirote; Gulpoli; Ambe dal; Panha; Piyush; Kokum sarbat; Taak; Kalwan; Kat vada; Tarri poha; Mandeli fry; Kalya vatanyachi usal; Shengdana chutney; Khekda masala; Tisrya masala; Kurdai; Sandge; Valache birde; Bhogichi bhaji; Gavran chicken; Dhirde; Ghadichi poli; Ukadiche modak; Fodnicha bhaat; Sabudana vada",
  },
  "ic-nonveg": {
    moonshot: "Tandoori chicken; Butter chicken; Chicken tikka masala; Chicken korma; Chicken curry; Chicken 65; Chilli chicken; Chicken Chettinad; Kadai chicken; Chicken do pyaza; Chicken handi; Chicken biryani; Mutton biryani; Rogan josh; Laal maas; Nihari; Haleem; Keema matar; Mutton curry; Kosha mangsho; Goan fish curry; Malabar fish curry; Prawn curry; Fish fry; Amritsari fish; Shorshe ilish; Chingri malai curry; Egg curry; Chicken vindaloo; Pork vindaloo; Chicken xacuti; Chicken cafreal; Sorpotel; Mutton sukka; Galouti kebab; Seekh kebab",
    deep: "Kolhapuri mutton; Saoji chicken; Kori gassi; Pandi curry; Kozhi varutha; Nattu kozhi curry; Chettinad mutton; Gongura mutton; Champaran mutton; Mutton paya; Bheja fry; Kaleji; Murgh musallam; Safed maas; Jungli maas; Gushtaba; Rista; Tabak maaz; Khad murgh; Mohan maas; Kalia; Kundan kaliya; Dum pukht; Chicken lollipop; Kukura jhola; Mutton kasha; Bhuna gosht; Pathar ka gosht; Machher jhol; Daab chingri; Bombil fry; Pomfret fry; Surmai fry; Karimeen pollichathu; Meen moilee; Chemmeen curry; Kerala beef fry",
  },
  "im-ranbir": {
    orbit: "Saawariya; Wake Up Sid; Ajab Prem Ki Ghazab Kahani; Raajneeti|rajneeti; Anjaana Anjaani; Bachna Ae Haseeno; Rocket Singh: Salesman of the Year; Jagga Jasoos; Tamasha; Roy; Bombay Velvet; Besharam; Shamshera; Tu Jhoothi Main Makkaar; Animal",
    moonshot: "PK; Ramayana; Love & War",
  },
  "ig-ganga-city": {
    orbit: "Prayagraj|allahabad; Varanasi; Haridwar; Rishikesh; Kanpur; Patna; Kolkata; Bhagalpur; Munger; Farrukhabad; Kannauj; Mirzapur; Ghazipur; Ballia; Buxar; Hajipur; Howrah; Uttarkashi; Devprayag; Rudraprayag",
    moonshot: "Chunar; Sahibganj; Rajmahal; Farakka; Murshidabad; Berhampore; Nabadwip; Kalna; Chinsurah; Serampore; Barrackpore; Uluberia; Diamond Harbour; Haldia; Kahalgaon; Barh; Mokama; Danapur; Chhapra; Sultanganj; Unnao; Fatehpur; Bijnor; Garhmukteshwar; Narora; Soron; Bithoor",
  },
  "gt-currency-symbol": {
    orbit: "Mona Lisa; The Last Supper; The Starry Night; The Scream; Girl with a Pearl Earring; The Birth of Venus; Guernica; The Creation of Adam; The Persistence of Memory; The Night Watch; Sunflowers; The Kiss; American Gothic; Water Lilies; The Great Wave off Kanagawa; Las Meninas",
    moonshot: "The School of Athens; The Garden of Earthly Delights; Liberty Leading the People; The Raft of the Medusa; Impression, Sunrise; Nighthawks; The Son of Man; Café Terrace at Night; Wanderer above the Sea of Fog; The Arnolfini Portrait; Primavera; The Hay Wain; The Fighting Temeraire; Olympia; Luncheon on the Grass; A Sunday Afternoon on the Island of La Grande Jatte; Bal du moulin de la Galette; The Gleaners; The Sleeping Gypsy; Whistler's Mother; Self-Portrait with Bandaged Ear; Les Demoiselles d'Avignon; Composition with Red, Blue and Yellow; Campbell's Soup Cans; Marilyn Diptych; Shakuntala; Lady in the Moonlight; Bharat Mata; Three Girls",
    deep: "Saturn Devouring His Son; The Third of May 1808; The Ambassadors; The Tower of Babel; Netherlandish Proverbs; The Hunters in the Snow; Judith Slaying Holofernes; The Calling of Saint Matthew; Isle of the Dead; The Nightmare; Ophelia; Christina's World; No. 5, 1948; Composition VIII; Broadway Boogie Woogie; The Swing; The Blue Boy; The Laughing Cavalier; The Milkmaid; View of Delft; The Anatomy Lesson of Dr. Nicolaes Tulp; Arrangement in Grey and Black; The Lady of Shalott; The Death of Marat; Napoleon Crossing the Alps; The Card Players; Dance at Le Moulin de la Galette; Blue Poles; Village Scene; Hamsa Damayanti; Galaxy of Musicians; Bride's Toilet; Mahishasura",
  },
  "auto-supercar": {
    moonshot: "Lamborghini Temerario|temerario; Ferrari F80|f80; McLaren W1|w1; McLaren 750S|750s; McLaren Artura|artura; McLaren GT; McLaren 570S|570s; McLaren 600LT|600lt; McLaren 765LT|765lt; McLaren 12C|mp4-12c; Porsche 959|959; Porsche 911 GT3|gt3; Porsche 911 Turbo S|911 turbo; Porsche 718 Cayman|718; Audi R8 V10; Mercedes-AMG One|amg one; Mercedes-AMG GT Black Series; Aston Martin DBS|dbs; Aston Martin DB11|db11; Aston Martin DB12|db12; Aston Martin Valhalla|valhalla; Bentley Continental GT|continental gt; Maserati MC20|mc20; Maserati GranTurismo|granturismo; Lotus Exige|exige; Lotus Emira|emira; Chevrolet Corvette Z06|z06; Ford Mustang Shelby GT500|shelby gt500; Dodge Charger Hellcat|hellcat; Nissan 370Z|370z; Nissan Z; Toyota GR Supra|gr supra; BMW M4|m4; BMW M5|m5; Bugatti Tourbillon|tourbillon; Koenigsegg Gemera|gemera; Pagani Utopia|utopia; Rimac Concept One",
    deep: "Ferrari 12Cilindri|12cilindri; Ferrari 296 GTS; Ferrari Purosangue; Lamborghini Huracán Sterrato|sterrato; Lamborghini Huracán STO|sto; Lamborghini Essenza SCV12; Lamborghini Veneno|veneno; Lamborghini Centenario|centenario; Lamborghini Sesto Elemento|sesto elemento; Bugatti Centodieci|centodieci; Bugatti La Voiture Noire|la voiture noire; Koenigsegg CC850|cc850; Koenigsegg Agera RS|agera rs; Hennessey Venom F5|venom f5; Gordon Murray T.50|t.50|t50; De Tomaso Pantera|pantera; De Tomaso P72|p72; Lancia Stratos|stratos; Alfa Romeo 33 Stradale|33 stradale; Jaguar C-X75; Ford GT40|gt40; Shelby Cobra|cobra; Plymouth Superbird|superbird; Mazda Cosmo; Isdera Imperator; Cizeta-Moroder V16T|cizeta; Venturi 400 GT; Brabham BT62|bt62; Czinger 21C|21c; Aspark Owl; Lotus Esprit|esprit",
  },
  "auto-engine-part": {
    moonshot: "Crankshaft pulley; Camshaft sprocket; Timing cover; Oil seal; Valve guide; Valve stem seal; Cylinder liner|sleeve; Main bearing; Big end bearing; Connecting rod bearing; Piston pin; Compression ring; Oil ring; Fuel rail; Fuel filter; Throttle valve; Idle control valve; Engine mount; Drive belt; Fan belt; Radiator fan; Coolant reservoir|expansion tank; Radiator cap; Oil cooler; Exhaust valve; Intake valve; Spark plug wire|ignition lead; Rotor arm; Distributor cap; Starter solenoid; Flywheel ring gear|ring gear",
    deep: "Variable valve timing|vvt; Cam phaser; Hydraulic tappet; Roller rocker; Valve keeper|collet; Valve retainer; Oil pickup; Oil pressure sensor; Coolant temperature sensor; Oxygen sensor|lambda sensor; Throttle position sensor; Turbo intercooler pipe; Charge pipe; Blow-by valve; Breather; Head bolt; Manifold gasket; Intake runner; Plenum; Air box; Mass air flow meter; Fuel pressure regulator; Common rail; High-pressure fuel pump; Glow plug relay; DPF|diesel particulate filter; Catalytic converter; Exhaust gas recirculation valve; Variable geometry turbo; Twin-scroll turbo",
  },
  "gc-nut": {
    orbit: "Almonds; Cashews; Peanuts; Walnuts; Pistachios; Hazelnuts; Macadamia nuts; Brazil nuts; Pecans; Pine nuts; Chestnuts; Sunflower seeds; Pumpkin seeds; Flax seeds; Chia seeds; Sesame seeds; Makhana; Lotus seeds",
    moonshot: "Chironji; Watermelon seeds; Melon seeds; Poppy seeds; Hemp seeds; Basil seeds|sabja; Quinoa; Areca nut; Betel nut; Water chestnut; Tiger nut; Coconut; Acorn; Kola nut; Candlenut; Ginkgo nut; Pili nut",
    deep: "Kukui nut; Marula; Mongongo; Baru nut; Sacha inchi; Shea nut; Bunya nut; Monkey puzzle nut; Beech nut; Butternut; Hickory nut; Heartnut; Cola nut; Paradise nut; Breadnut; Jack seeds|jackfruit seeds; Charoli",
  },
  "gt-superhero": {
    moonshot: "Thor; Hulk; Black Panther; Doctor Strange; Wolverine; Deadpool; Black Widow; Hawkeye; Ant-Man; Aquaman; The Flash; Green Lantern; Captain Marvel; Scarlet Witch; Vision; Daredevil; Cyclops; Storm; Jean Grey|phoenix; Beast; Iceman; Rogue; Gambit; Nightcrawler; Colossus; Professor X; Magneto; Silver Surfer; Ghost Rider; Moon Knight; Ms. Marvel; Shang-Chi; Falcon; Winter Soldier; War Machine; Star-Lord; Gamora; Groot; Rocket Raccoon; Drax; Mantis; Nebula; She-Hulk; Wasp; Mister Fantastic; Invisible Woman; Human Torch; The Thing; Batgirl; Nightwing; Robin; Supergirl; Superboy; Green Arrow; Black Canary; Cyborg; Shazam; Martian Manhunter; Hawkman; Hawkgirl; Zatanna; Raven; Starfire; Beast Boy; Blue Beetle; Booster Gold",
    deep: "Spider-Gwen|ghost-spider; Miles Morales; Spider-Woman; Iron Fist; Luke Cage; Jessica Jones; Punisher; Elektra; Blade; Namor; Nova; Captain Britain; Psylocke; Cable; Domino; Kitty Pryde; Jubilee; Emma Frost; Havok; Polaris; Squirrel Girl; Moon Girl; Kamala Khan; America Chavez; Kate Bishop; Yelena Belova; Echo; Hercules; Adam Warlock; Captain Atom; Firestorm; Static; The Atom; Plastic Man; Swamp Thing; Constantine; Spectre; Doctor Fate; Huntress; Catwoman; Red Hood; Damian Wayne; Batwoman; Vixen; Mister Miracle; Big Barda; Krrish; Shaktimaan; Nagraj; Super Commando Dhruva; Doga; Parmanu; Minnal Murali; Hanu-Man; G.One; Ra.One",
  },
  "gt-language-world": {
    moonshot: "Indonesian; Malay; Thai; Vietnamese; Turkish; Persian; Swahili; Hausa; Yoruba; Igbo; Amharic; Somali; Zulu; Xhosa; Afrikaans; Dutch; Polish; Ukrainian; Romanian; Greek; Czech; Hungarian; Swedish; Norwegian; Danish; Finnish; Hebrew; Tagalog; Burmese; Khmer; Lao; Mongolian; Kazakh; Uzbek; Pashto; Sindhi; Nepali; Sinhala; Tamil; Telugu; Kannada; Malayalam; Marathi; Gujarati; Punjabi; Odia; Assamese; Konkani; Maithili; Santali; Kashmiri; Dogri; Bodo; Manipuri; Sanskrit",
    deep: "Basque; Catalan; Galician; Welsh; Irish; Scottish Gaelic; Breton; Icelandic; Faroese; Maltese; Albanian; Georgian; Armenian; Azerbaijani; Kurdish; Uyghur; Tibetan; Dzongkha; Mizo; Khasi; Garo; Kokborok; Ladakhi; Lepcha; Toda; Kodava; Tulu; Gondi; Ho; Mundari; Kurukh; Bhili; Bhojpuri; Awadhi; Magahi; Chhattisgarhi; Rajasthani; Haryanvi; Marwari; Esperanto; Quechua; Guarani; Aymara; Navajo; Maori; Hawaiian; Samoan; Tongan; Fijian; Malagasy; Wolof; Lingala; Kinyarwanda; Tigrinya; Oromo; Ainu; Latin; Ancient Greek; Old English; Pali; Prakrit",
  },
  "hist-ww1": {
    orbit: "Ottoman Empire; Austria-Hungary; Bulgaria; Italy; Japan; Serbia; Belgium; Canada; Australia; New Zealand; India; South Africa; Romania; Greece; Portugal; Montenegro; China; Brazil; Siam",
    deep: "Liberia; Guatemala; Panama; Cuba; Haiti; Honduras; Nicaragua; Costa Rica; San Marino; Hejaz; Newfoundland; Luxembourg; Persia; Arab Revolt|hejaz",
  },
  "gt-planet-moon": {
    deep: "Aitne; Arche; Autonoe; Callirrhoe; Carpo; Chaldene; Cyllene; Dia; Eirene; Elara; Ersa; Euanthe; Eukelade; Eupheme; Euporie; Eurydome; Harpalyke; Hegemone; Helike; Hermippe; Herse; Iocaste; Isonoe; Kale; Kallichore; Kalyke; Kore; Megaclite; Mneme; Orthosie; Pandia; Pasithee; Philophrosyne; Praxidike; Sponde; Taygete; Thelxinoe; Themisto; Thyone; Valetudo; Aegaeon; Albiorix; Anthe; Bebhionn; Bergelmir; Bestla; Erriapus; Farbauti; Fenrir; Fornjot; Greip; Hati; Hyrrokkin; Ijiraq; Jarnsaxa; Kari; Kiviuq; Loge; Methone; Mundilfari; Narvi; Paaliaq; Pallene; Polydeuces; Siarnaq; Skathi; Skoll; Surtur; Suttungr; Tarqeq; Tarvos; Thrymr; Ymir; Cupid; Mab; Perdita; Francisco; Margaret; Prospero; Setebos; Stephano; Trinculo; Ferdinand; Halimede; Laomedeia; Neso; Psamathe; Sao; Hippocamp; Charon",
  },
};
