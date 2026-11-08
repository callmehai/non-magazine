/**
 * Chương 2 — Cấu tạo, nguyên liệu và kỹ thuật làm nón Làng Chuông. Mỗi đoạn: [tiếng Việt, tiếng Nhật]
 * Tiếng Việt: nguyên văn tab "Chương 2" (Doc "ND + HT - Nón lá đã sửa", bản sửa lần 1); tiếng Nhật: bản dịch chính thức của nhóm
 * (tab "JA パート2", tải 06/11/2026), phiên âm {漢字|かな} giữ theo bản cũ.
 */
export const ch2 = {
  no: 2,
  label: ['Chương 2', 'パート2'],
  title: ['Cấu tạo, nguyên liệu và\nkỹ thuật làm nón Làng Chuông', 'チュオン{村|むら}のノンラーの\n{構造|こうぞう}・{材料|ざいりょう}・{製作技術|せいさくぎじゅつ}'],
  lead: [
    'Nhắc đến Làng Chuông là nhắc đến mảnh đất với những chiếc nón lá bền đẹp nổi danh khắp trong và ngoài nước. Tuy nhiên, để tạo nên một sản phẩm vừa mang tính ứng dụng cao vừa đạt đến giá trị thẩm mỹ tinh tế, đó là cả một nghệ thuật đòi hỏi sự kết hợp nhuần nhuyễn giữa nhiều yếu tố cốt lõi: từ khâu tuyển chọn nguyên liệu tự nhiên, kỹ thuật xử lý tỉ mỉ qua từng công đoạn, cho đến kinh nghiệm tích lũy và đôi bàn tay khéo léo của người thợ thủ công.',
    'チュオン村は、{丈夫|じょうぶ}で{美|うつく}しいノンラーの産地として国内外に広く知られています。高い実用性と{洗練|せんれん}された美しさを{兼|か}ね{備|そな}えた製品を生み出す工程は、一つの芸術と言えます。そこには、天然素材の{厳選|げんせん}、各製作工程での{丁寧|ていねい}な材料{処理|しょり}、そして職人が培ってきた経験と{巧|たく}みな手仕事を{調和|ちょうわ}させることが求められます。',
  ],
  // chương mở đầu bằng ba đoạn dẫn: đoạn 1 ở trang mở chương, hai đoạn sau đầu nội dung
  intro: [
    [
      'Nhằm giúp người đọc có cái nhìn toàn diện và sâu sắc hơn về hành trình hình thành nên chiếc nón lá truyền thống, Chương 2 sẽ tập trung giới thiệu chi tiết từng khía cạnh trong quy trình chế tác tại Làng Chuông. Nội dung chương bắt đầu bằng việc trình bày đặc điểm cấu tạo 3 lớp đặc trưng của nón, tiếp đó giới thiệu các nguyên liệu như lá lụi, vòng nứa¹, chỉ khâu, và đi sâu vào từng bước trong quy trình kỹ thuật thủ công từ sơ chế lá, uốn vành, khâu nón cho đến giai đoạn hoàn thiện sản phẩm.',
      '{伝統的|でんとうてき}なノンラーが出来上がるまでの過程をより深層から理解できるよう、パート2ではチュオン村における製作工程の全貌を詳しく紹介します。まず、ノンラー特有の三層構造について{触|ふ}れ、続いてラルイ、ヌア¹で作られた輪、縫い糸などの材料を紹介します。さらに、{葉|は}の準備と下処理、ヌアひごを曲げて輪にする作業、{縫|ぬ}い{付|つ}けから{仕上|しあ}げに至るまでの手作業による各工程を一つずつ掘り下げていきます。',
    ],
    [
      'Thông qua việc kết nối giữa yếu tố vật liệu, cấu trúc và thao tác kỹ thuật, chương này không chỉ phác họa rõ nét bức tranh toàn cảnh về quy trình sản xuất nón Làng Chuông, mà còn tôn vinh giá trị lao động đã được gìn giữ qua nhiều thế hệ.',
      '材料・構造・技術的な作業を関連付けながら説明することで、チュオン村のノンラー作りにおける全体像を明らかにするとともに、代々受け継がれてきた伝統工芸の価値を伝えます。',
    ],
  ],

  notes: [['¹ Cây nứa: Loài cây cùng họ với tre, thân mỏng, gióng dài, thường mọc thành bụi ở rừng. Thân cây nứa đã chặt, chẻ ra, dùng để đan phên, đan lát hoặc làm đồ thủ công.', '¹ ヌア：竹の{仲間|なかま}で、{幹|みき}が{薄|うす}く{節|ふし}と節の間が長く、森に{群生|ぐんせい}する。切って{割|わ}った幹は、{壁|かべ}や{編|あ}み{物|もの}、手工芸品に使われる。']],

  // ── 2.1
  structure: {
    id: '2.1',
    title: ['Cấu tạo của nón lá Làng Chuông', 'チュオン村のノンラーの構造'],
    intro: [
      'Nón lá Làng Chuông gồm hai phần chính: phần khung nón và phần lá lợp. Phần khung có chức năng định hình dáng chóp, nâng đỡ và duy trì hình dáng của nón, trong khi đó phần lá lợp tạo nên bề mặt bên ngoài của nón. Sự kết hợp giữa hai phần tạo nên chiếc nón có vẻ ngoài thanh mảnh nhưng vẫn chắc chắn, và độ bền cao trong quá trình sử dụng.',
      'チュオン村のノンラーは、主に{骨組|ほねぐ}みと、それを覆う葉の二つの部分から構成されています。骨組みは円錐形を形作り、ノンラーを{支|ささ}えてその形を保つ{役割|やくわり}を{担|にな}い、葉はノンラーの{外側|そとがわ}の表面を形成します。この二つが組み合わさることで、すっきりとした外観でありながら、しっかりとした構造と使用時の高い耐久性を備えたノンラーになります。',
    ],
    parts: [
      [['Phần khung nón', 'ノンラーの骨組み'], ['Gồm 16 vành nứa có đường kính giảm dần từ đáy lên chóp. Các vành được sắp xếp theo dáng nón, giúp định hình và nâng đỡ phần lá lợp.', '底部から頂点に向かって直径が徐々に小さくなる16本のヌアひごの輪で構成されています。各輪はノンラーの形に合わせて配置され、形を整えるとともに、表面を覆う葉を支えます。']],
      [['Phần lá lợp', '表面を覆う葉'], ['Gồm ba lớp vật liệu xếp chồng lên nhau, bao gồm lớp lá lụi bên ngoài, lớp mo nang ở giữa và lớp lá lụi bên trong. Các lớp này góp phần che chắn, tạo độ ổn định và hoàn thiện bề mặt nón.', '外側のラルイ、中間のヌアの皮、内側のラルイという三層の材料を{重|かさ}ねた構造です。これらの層は、ノンラーの覆いとしての機能を担い、形を安定させ、表面を整える役割を果たします。']],
    ],
    layers: {
      id: '2.1.2',
      h: ['Cấu trúc lợp lá ba lớp', '葉の三層構造'],
      intro: [
        'Nón lá Làng Chuông sử dụng cấu trúc lợp ba lớp vật liệu xếp chồng lên nhau, gồm lớp lá lụi bên ngoài, lớp mo nang ở giữa và lớp lá lụi bên trong. Mỗi lớp đảm nhiệm một chức năng riêng, góp phần tạo nên độ bền và tính thẩm mỹ của chiếc nón.',
        'チュオン村のノンラーは、外側のラルイ、中間のヌアの皮、内側のラルイという三層の材料を重ねた構造です。それぞれの層が異なる役割を担い、ノンラーの耐久性と美しさを生み出しています。',
      ],
      items: [
        [['Lớp lá lụi (lớp trong)', 'ラルイの層（内層）'], ['Nằm ở mặt trong của nón, có tác dụng che phủ lớp mo nang, hoàn thiện lòng nón và tạo bề mặt gọn gàng. Lớp này góp phần bảo vệ phần vật liệu bên trong, đồng thời tăng tính thẩm mỹ cho sản phẩm.', 'ノンラーの内側に位置し、ヌアの皮を覆い、内面をすっきりと整える役割を果たします。内部の材料を保護するとともに、製品の美しさを高めます。']],
        [['Lớp mo nang (lớp giữa)', 'ヌアの皮の層（中間層）'], ['Nằm giữa hai lớp lá lụi, có tác dụng làm lớp đệm, tăng độ chắc chắn và hỗ trợ duy trì hình dáng thân nón. Nhờ lớp mo nang, phần lá lợp có độ dày cần thiết mà vẫn giữ được đặc điểm nhẹ của sản phẩm.', '二層のラルイの{間|あいだ}に位置し、{緩衝材|かんしょうざい}の役割を果たすとともに、強度を高め、ノンラーの胴部の形を保つのを{助|たす}けます。この層によって、葉を重ねた部分に必要な{厚|あつ}みを持たせながら、製品の軽さも保っています。']],
        [['Lớp lá lụi (lớp ngoài)', 'ラルイの層（外層）'], ['Sử dụng lá lụi trắng, có đặc điểm mỏng, dài và màu sắc sáng tương đối đồng đều. Đây là lớp tiếp xúc trực tiếp với môi trường bên ngoài, có tác dụng che nắng, mưa và tạo diện mạo cho chiếc nón.', '薄くて長く、明るい色が比較的均一な白いラルイの葉を使います。外部の{環境|かんきょう}に{直接|ちょくせつ}触れる層であり、日差しや雨を遮るとともに、ノンラーの外観を形作ります。']],
      ],
      // một dòng tóm tắt cho mô hình 3D ba lớp (bấm vào lớp nào thì lớp đó sáng màu)
      short: [
        ['Che lớp mo nang, hoàn thiện lòng nón', 'ヌアの皮を覆い、内面をすっきりと整える'],
        ['Lớp đệm giúp nón chắc chắn, giữ dáng mà vẫn nhẹ', '緩衝材の役割を果たし、強度を高め、胴部の形を保つ'],
        ['Che nắng, che mưa và tạo diện mạo cho nón', '日差しや雨を遮り、ノンラーの外観を形作る'],
      ],
      // lớp tương ứng trên mô hình 3D (mô hình xếp ngoài trên cùng, trong dưới cùng)
      kinds: ['inner', 'mo', 'outer'],
      outro: [
        'Như vậy, ba lớp vật liệu có chức năng bổ trợ cho nhau trong cấu tạo của nón lá Làng Chuông. Lớp lá ngoài đảm nhiệm việc che chắn và tạo bề mặt, lớp mo nang góp phần tăng độ chắc chắn, còn lớp lá trong giúp hoàn thiện mặt trong của nón. Sự kết hợp này tạo nên phần lá lợp vừa nhẹ nhàng, vừa có độ ổn định cần thiết trong quá trình sử dụng.',
        'このように、三層の材料は、チュオン村のノンラーの構造の中で{互|たが}いの機能を補っています。外側の葉が日差しや雨を遮って表面を形成し、ヌアの皮が強度を高め、内側の葉が内面を整えます。これらを組み合わせることで、葉を重ねた部分の軽さと、使用時に必要な形の安定性が保たれています。',
      ],
      image: ['Chiếc nón đang lợp dở: lớp mo nang lộ ra giữa các lớp lá', '重ねている途中のノンラー：葉の間からヌアの皮の層がのぞく'],
    },
    frame: {
      id: '2.1.1',
      h: ['Cấu trúc khung 16 vòng', 'ヌアで作られた16本の輪からなる骨組みの構造'],
      p: [
        [
          'Phần khung nón Làng Chuông gồm 16 vòng được làm bằng nứa, có chức năng định hình, nâng đỡ lớp lá và duy trì dáng chóp của nón. Các vành được bố trí từ dưới lên trên, với đường kính giảm dần theo độ thuôn của thân nón. Phần vành dưới có kích thước lớn hơn, tạo độ rộng cho nón, trong khi các vành phía trên nhỏ dần để hình thành độ dốc và phần chóp nhọn.',
          'チュオン村のノンラーの骨組みは、ヌアで作られた16本の輪で構成され、形を整え、葉の層を支え、円錐形を保つ役割を担っています。各輪は、ノンラーが上に向かって細くなる形に合わせて、下から上へと直径が徐々に小さくなるように配置されています。下部の大きな輪がノンラーの幅を作り、上部に向かって輪が小さくなることで、側面の{傾斜|けいしゃ}と尖った頂部が形作られます。',
        ],
      ],
      after: [
        [
          'Theo lời kể của các nghệ nhân Làng Chuông, các cụ xưa còn lý giải rằng 16 vòng nón tượng trưng cho tuổi trăng tròn của người con gái, độ tuổi được xem là đẹp nhất của thời thanh xuân. Cách lý giải này gắn cấu tạo của chiếc nón với quan niệm dân gian về vẻ đẹp của người phụ nữ ngày xưa.',
          'チュオン村の職人の話によると、昔の人々は、16本の輪が、{青春|せいしゅん}の中で最も美しい時期とされた女性の16歳を象徴すると説明していたそうです。この解釈は、ノンラーの構造を、かつての女性の美しさに関する{民間|みんかん}の考え方と結びつけるものです。',
        ],
        [
          'Các vòng nón được làm từ nứa nhờ đặc tính nhẹ, dai và có độ đàn hồi phù hợp, giúp khung nón chắc chắn mà không làm tăng đáng kể trọng lượng sản phẩm. Khoảng cách và vị trí của các vành cần được bố trí tương đối đều để tạo sự cân đối giữa phần vành, thân và chóp nón. Cách sắp xếp này cũng giúp lớp lá được nâng đỡ trên toàn bộ bề mặt, góp phần duy trì hình dáng ổn định sau khi hoàn thiện.',
          '{輪|わ}の材料には、軽く、しなやかで、適度な{弾力|だんりょく}を持つヌアが使われています。こうした性質により、製品の重さを大きく増やすことなく、丈夫な骨組みを作ることができます。輪は、外縁・胴部・頂点のバランスが取れるよう、間隔や位置を調整しながら比較的{均等|きんとう}に配置する必要があります。この配置によって、葉の層が全面にわたって支えられ、仕上げた後も形を安定して保つことができます。',
        ],
        [
          'Bên cạnh cách bố trí các vành, việc xử lý các điểm nối cũng ảnh hưởng đến độ đều của khung nón. Các mối nối cần được làm gọn, hạn chế những chỗ nhô cao hoặc gồ ghề để không ảnh hưởng đến quá trình lợp lá và chằm nón. Khi các vành nứa được sắp xếp cân đối và liên kết chắc chắn, phần khung tạo nền tảng cho lớp lá lợp, góp phần làm nên chiếc nón Làng Chuông có dáng chóp thanh mảnh nhưng vẫn chắc chắn và bền trong quá trình sử dụng.',
          '輪の配置に加え、{継|つ}ぎ目の処理も骨組みの{均整|きんせい}に影響します。葉を重ねて覆う作業や縫い付けに支障が出ないよう、継ぎ目はすっきりと整え、突起や{凹凸|おうとつ}をできるだけ抑える必要があります。ヌアの輪をバランスよく配置し、しっかりとつなぐことで、骨組みが葉の層を支える{土台|どだい}となり、すっきりとした円錐形でありながら、丈夫で使用時の耐久性も備えたチュオン村のノンラー作りに貢献します。',
        ],
      ],
      image: ['Nghệ nhân Lê Văn Tuy nối vành nứa vào khung nón', 'ヌアの輪を骨組みにつなぐ職人レ・ヴァン・トゥイ氏'],
    },
  },

  // ── 2.2
  materials: {
    id: '2.2',
    title: ['Nguyên liệu và dụng cụ làm nón lá', 'ノンラーの製作に使用する材料と道具'],
    items: [
      [['Lá lụi (lá cọ non)', 'ラルイ（若いヤシの葉）'], ['Là loại lá khô, chủ yếu được nhập từ các tỉnh miền Trung như Thanh Hóa, Nghệ An. Khi tới các làng nghề (như làng nón Chuông), hình ảnh những triền đê phủ đầy lá lụi phơi nắng đã trở nên quen thuộc.', 'ラルイは、チュオン村のノンラーの耐久性や色合い、すっきりとした優美な形を{左右|さゆう}する重要な材料です。この材料の大部分は、タインホア省やゲアン省など、ベトナム中部の各{省|しょう}から{仕入|しい}れられています。村に運ばれてきた新鮮な葉は、丁寧な下処理を経て、{堤防|ていぼう}の斜面一面に広げられ、天日干しにされます。こうして、堤防にラルイが広がる光景は、この村ならではの{労働|ろうどう}風景として親しまれるようになりました。ここでは、風と日光の自然な作用によって、葉の色が鮮やかな緑色から象牙色へと変わり、次の加工工程に進む準備が整います。'], ['Búp lá cọ non phơi khô, màu trắng ngà', '{干|ほ}した若いヤシの葉（象牙色）']],
      [['Thanh nứa', 'ヌアの細い竹材'], ['Được chuốt vót công phu thành những sợi mảnh, tròn đều rồi uốn nối lại thành các vòng nón với kích thước từ nhỏ đến lớn. Đây chính là phần khung xương giúp định hình dáng nón.', 'ヌアは竹の{一種|いっしゅ}で、細く、均一な丸い棒状になるまで丁寧に削られます。その後、曲げて両端をつなぎ合わせ、大きさの異なる輪に仕上げます。これらの輪はノンラーの骨組みとなり、形を整える役割を果たします。'], ['Các thanh nứa vót mỏng', '細く削ったヌア']],
      [['Mo nang (lớp mo nứa)', 'モーナン（ヌア竹の皮）'], ['Được đặt làm lớp giữa các lớp lá, giúp chiếc nón giữ được độ chắc chắn và cứng cáp.', 'モーナンは、ノンラーの葉の層の間に挟み込まれ、ノンラーの強度と硬さを保つ役割を果たします。'], ['Lớp mo nang', 'モーナン（ヌア竹の皮）']],
      [['Sợi cước', '縫い糸（ナイロン糸）'], ['Trước đây, nón được làm bằng sợi móc và sợi dứa làm từ cây móc và cây dứa nhưng từ đầu những năm 80, đã được thay bằng sợi cước nhờ tính thẩm mỹ, độ bền và tiện lợi. Cước có nhiều kích cỡ và được bán theo lạng hoặc mua cả guổng (1 kg). Thường được mua tại Chợ Chuông có khu vực chuyên bán cước và các dụng cụ làm nón.', '以前は、モックという植物やパイナップルから作られた{繊維|せんい}がノンラーの製作に使われていました。しかし、1980年代初頭からは、見た目の美しさ、耐久性、使いやすさを理由に、ナイロン糸へと切り替わりました。ナイロン糸にはさまざまな太さがあり、100グラム{単位|たんい}、または「グオン」と呼ばれる1キログラム単位で販売されています。通常はチュオン市場で購入されており、市場内にはナイロン糸やノンラーの製作道具を{専門|せんもん}に扱う売り場があります。'], ['Cuộn sợi cước', '縫い糸（ナイロン糸）']],
      [['Liếc (cây lòng bông)', 'リエックの茎の芯（シダ類の植物）'], ['Liếc (hay cây lòng bông thuộc họ dương xỉ) do người làng Lưu Thượng (Phú Xuyên) cung cấp, bán theo bó khoảng 100 cây để tách ruột và vỏ làm nón. Trong đó, phần ruột (guột) dùng để buộc nối đầu sợi vòng giúp chiếc nón mịn màng, hài hòa; còn phần vỏ cứng, bóng, màu nâu sẫm được chẻ đôi khâu cùng vòng nứa để cạp nón thêm chắc chắn.', 'リエックは、フースエンのルー・トゥオン村の人々によって供給され、約100本を一束として販売されています。ノンラーの製作では、茎の{芯|しん}と外皮を分けて使用します。芯の部分は「グオット」と呼ばれ、輪を作る細い材料の端同士を結びつけるために使われます。これにより、ノンラーの表面が滑らかで調和の取れた仕上がりになります。一方、{硬|かた}く光沢のある濃い茶色の外皮は、縦に二つに裂き、ヌアで作られた輪と一緒に縫い付けることで、ノンラーの外縁をより丈夫にします。'], ['Cây liếc — ruột và vỏ', 'リエック：芯と皮']],
      [['Sợi luồn nhôi (sợi chỉ màu)', 'ノイを作るための{色糸|いろいと}'], ['Dùng để tạo và cố định giữ chắc phần quai nón khi sử dụng.', 'ノイを作るために使用する色糸です。ノイは、ノンラーを着用する際に、あごひもを通してしっかりと{固定|こてい}するための部分です。'], ['Sợi chỉ màu', 'ノイを作るための色糸']],
    ],
    tools: [
      [
        ['Khuôn nón', 'ノンラーの製作型'],
        [
          'Khuôn nón tạo ra dáng nón. Dáng nón thanh thoát, nhẹ nhàng, được quyết định bởi khuôn nón ("Nón tốt nhờ khuôn"). Một khuôn nón gồm 8 thanh (gọng) và 01 vòng cạp, mỗi thanh đều có 16 răng cưa để đặt 16 vòng con. Tám thanh được tụ lại bằng một ốc làm bằng một chốt nhựa. Ban đầu, người làng Chuông tự làm khuôn, pha tre tạo từng thanh một, để tạo được một khuôn nón mất rất nhiều thời gian, thu nhập không bằng khâu nón.',
          'ノンラーの製作型は、ノンラーの形を決める道具であり、すっきりとした優美な形を作るために使用します。そのため、ノンラー作りには「良いノンラーは型で決まる」という言葉があります。一つの製作型は、8本の支柱と外縁用の輪1本で構成されています。各支柱には、ノンラーの輪をはめ込むための16か所の切り{込|こ}みがあります。8本の支柱は、型の頂点でプラスチック製の留め具を備えた固定部品によって連結されています。かつてチュオン村では、村の人々が自ら製作型を作っていました。しかし、この作業には多くの時間と労力が必要でした。',
        ],
        ['Khuôn nón hình chóp 16 vòng', 'ノンラーの製作型'],
      ],
    ],
    moldMore: [
      [
        'Trước đây, người làng Chuông tự làm khuôn nón. Tuy nhiên, từ những năm 1970 trở lại đây, việc này do thợ làng Vác (làng Canh Hoạch, xã Dân Hòa) đảm nhiệm. Để làm được một chiếc khuôn nón đạt chuẩn, người thợ phải chọn tre già dài đốt, ít mắt, rồi ngâm dưới ao khoảng 3 tháng. Sau đó, người thợ cưa tre thành từng thanh nón, mỗi thanh đều được cưa khấc để đặt vành nón. Trên đầu mỗi thanh, họ khoan một lỗ tròn nhỏ để gắn ốc nón, sao cho 8 thanh ghép lại với nhau vừa khít. Thao tác ghép đòi hỏi tay nghề cao: nếu lực quá chặt sẽ làm vỡ khuôn, còn nếu quá lỏng thì khuôn bị yếu, không thể dựng được.',
        '1970年代以降、製作型の製作は、次第にヴァック村（ザンホア社カインホアック村）の職人が担うようになりました。規格に合った製作型を作るために、職人はまず、節の間隔が長く、節の少ない成熟した竹を選び、池に約3か月間浸します。その後、竹を切って支柱を作り、それぞれに輪をはめる切り込みを入れます。各支柱の上端には、連結部品を{取|と}り{付|つ}けるための小さな丸い穴を開け、8本の支柱が隙間なく組み合わさるようにします。この組み立てには、熟練した技術と正確な作業が求められます。きつく組み合わせすぎると型が割れるおそれがあり、逆に緩すぎると強度が不足し、型を安定して立てることができません。',
      ],
      [
        'Cuối cùng, để hoàn thiện chiếc khuôn, cần thêm một sợi vòng do thợ làng Đôn Thư chế tạo, giúp liên kết các thanh tre thành một hình chóp theo đúng phom dáng của chiếc nón.',
        '最後に、ドン・トゥー村の職人が製作した輪を取り付け、各支柱をつなぎ合わせます。こうして、ノンラー本来の形に合った円錐形の製作型が完成します。',
      ],
    ],
    small: [
      [['Dao, kéo', 'ナイフ・はさみ'], ['Dùng để xử lý, cắt tỉa lá và gọt giũa các chi tiết nguyên liệu.', '葉の処理や裁断、材料の{細部|さいぶ}を削って形を整えるために使用します。'], ['Dao, kéo cắt lá', '葉を切るナイフとはさみ']],
      [['Dụng cụ là lá', '葉を平らに伸ばす道具'], ['Giúp là phẳng phiu từng chiếc lá trước khi đưa vào khâu. Thường là lưỡi cày bằng gang cũ, phẳng, nhẵn.', 'ノンラーを縫う前に、葉を一枚ずつ平らに伸ばすための道具です。現在では、一般的に電気コンロと表面が平らで滑らかな金属板を組み合わせて使用します。'], ['Lưỡi cày gang đặt trên bếp điện', '葉を平らに伸ばす道具']],
    ],
    outro: [
      'Để tạo ra một chiếc nón đẹp, người thợ phải tự tay lựa chọn kỹ càng từng lá, đoạn vòng và sợi cước theo những tiêu chuẩn khắt khe: lá phải có thịt trong, trắng và gân nhỏ; vòng phải tròn, nhỏ với các mấu đều phẳng; còn mo phải là loại vàng óng, kích thước vừa vặn. Và để biến những nguyên liệu thô ấy thành phẩm chất lượng, người thợ bắt đầu bước vào chuỗi các công đoạn chế tác tỉ mỉ dưới đây.',
      '美しいノンラーを作るためには、職人が葉、輪に使う材料、ナイロン糸を一つひとつ{厳|きび}しい{基準|きじゅん}で選ぶ必要があります。葉は葉肉が透けるように薄く、白く、{葉脈|ようみゃく}が細いもの、輪は細く丸く、節の部分が平らなものが求められます。また、モーナンは{黄金色|こがねいろ}の光沢があり、大きさが適切なものを選びます。こうして選び抜かれた素材を品質の高い製品に仕上げるため、職人は次に紹介する一連の細かな製作工程へと進みます。',
    ],
  },

  // ── 2.3
  process: {
    id: '2.3',
    title: ['Kỹ thuật và các công đoạn làm nón lá làng Chuông', 'チュオン村におけるノンラーの製作技術と工程'],
    leaf: {
      id: '2.3.1',
      h: ['Công đoạn chuẩn bị và xử lý lá', '葉の準備と下処理'],
      p: [
        [
          'Quy trình chuẩn bị lá nón bắt đầu từ công đoạn vò lá (chỉ áp dụng với lá lụi mua về còn tươi và nhiều nước), lá phải được vò qua cát để hút bớt độ ẩm, giúp lá khô, trắng và không bị thối. Cát dùng để vò được lấy từ giữa lòng sông Đáy, phơi khô khoảng một ngày và đãi sạch sạn sỏi bằng giản đan bằng tre trước khi đổ vào bãi vò rộng khoảng 10 mét vuông. Công việc này rất vất vả, đòi hỏi sức lực – thường do con trai đảm nhận, với thời gian vò khoảng 10 phút cho đến khi lá mềm. Sau khi vò xong, lá được đem phơi dọc bờ đê, cánh đồng hoặc sân gạch và phải đảo lá vào gần trưa để lá khô đều hai mặt. Thời gian phơi phụ thuộc vào thời tiết; mùa hè cần khoảng 2 đến 3 nắng, trong khi mùa đông cần phơi lâu hơn. Nếu gặp ngày nắng yếu hoặc mưa dầm, khi lá khô được khoảng 50 đến 60%, người thợ sẽ tiến hành sấy lá với số lượng khoảng 2.000 lá (nếu lá ướt) hoặc 2 lượt (nếu lá khô hơn) cho mỗi lần sấy. Lá sau khi khô sẽ được bó thành từng túm, mỗi túm khoảng 20 tàu.',
          '仕入れたラルイがまだ新鮮で、水分を多く含んでいる場合は、まず砂とともに葉をもみ込む作業を行います。この工程では、葉の水分を減らし、乾燥させて白くするとともに、腐敗を{防|ふせ}ぎます。この作業に使う砂は、ダーイ川の川底の中央付近から採取します。砂を約1日天日干しにした後、竹で編んだふるいを使って小石や砂利を取り除きます。この工程は体力を要するため、主に男性が担当します。葉が柔らかくなるまで、約10分間もみ込みます。その後、葉を堤防沿いや畑、れんが{敷|じ}きの{庭|にわ}などに広げて天日干しにします。昼近くには葉を{裏返|うらがえ}し、両面が均等に乾くようにします。乾燥にかかる時間は天候によって異なります。夏は通常、晴天の日に2～3日程度干しますが、冬はさらに長い時間が必要です。日差しが弱い日や雨が長く続く場合は、葉が50～60％程度乾いた段階で、加熱して乾燥させます。乾燥後、葉は約20枚ずつ小さな束にまとめられます。',
        ],
        [
          'Đối với công đoạn phơi lá, lá mua về phải được phơi nắng trên nền đất với hai mép tàu lá kéo căng và có vật nặng đè xung quanh để mặt lá đón trọn ánh nắng. Sau khi phơi khô, lá được xếp thành từng bó (mỗi bó 10 tàu), ngâm nước 3 tiếng, dựng lên cho ráo nước rồi phơi tiếp hai nắng. Cuối cùng, người thợ tiến hành phơi lá vào ban đêm để lá "ăn" (ngấm) sương nhằm giúp lá mềm mại, tránh bị gãy rách khi khâu.',
          '仕入れた葉を地面に広げて天日干しにします。このとき、葉の両端を引っ張って伸ばし、周囲に重しを置いて固定することで、葉の表面全体に日光が当たるようにします。葉が乾いたら、約10枚ずつ束にして約3時間水に{浸|ひた}します。その後、葉を立てて水を切り、再び晴天の日に2日ほど干します。最後に、葉を夜間に屋外に置き、{夜露|よつゆ}を吸収させます。この作業はベトナム語で「アンスオン（葉に夜露を吸収させること）」と呼ばれます。夜露によって葉が柔らかくなり、ノンラーを縫う際に{折|お}れたり{破|やぶ}れたりするのを防ぎます。',
        ],
      ],
      images: [
        // góp ý 04/11: ảnh theo file nhóm gán (Sheet: vò lá, chọn lá IMG_7819 · phơi lá IMG_4613)
        ['Lá lụi tươi trước khi vò và chọn lá', '乾燥させる前の生ラルイの下処理'],
        ['Phơi lá lụi dưới nắng', 'シートの上でラルイを干す住民の様子'],
      ],
    },
    stepsH: { id: '2.3.2', h: ['Quy trình dựng và hoàn thiện nón', 'ノンラーの組み立てと仕上げ'] },
    journey: ['Bảy bước dựng nón và khâu hoàn thiện — bấm vào chặng để xem kỹ', 'ノンラーができるまでの七つの{工程|こうてい}と仕上げ ― 気になる工程をクリック'],
    done: ['Chiếc nón trắng\nhoàn thiện!', '白いノンラーの\n完成！'],
    stripTitle: ['Quy trình chế tác', '製作工程'],
    steps: [
      {
        no: 1,
        name: ['Rẽ lá', 'ゼー・ラー'],
        sub: ['vuốt phẳng lá', '葉のしわや反りを伸ばして平らにする作業'],
        text: [
          [
            'Công đoạn rẽ lá được thực hiện do lá nón mua về vẫn còn tình trạng quăn và nhăn, cần được rẽ lại cho thật phẳng. Khi tiến hành, người thợ đặt mặt phải của cành lá hướng lên trên và thực hiện rẽ từ ngọn xuống dưới cuống. Thao tác cụ thể là dùng hai ngón cái để giữ mặt trước mép lá, trong khi tám ngón còn lại cầm ở mặt sau, vừa rẽ vừa kết hợp miết cho lá phẳng.',
            '仕入れたノンラー用の葉には、まだ反りやしわが残っているため、「ゼー・ラー」と呼ばれる作業で丁寧に伸ばし、平らに整える必要があります。作業では、葉の表側を上に向け、先端から葉柄の付け根に向かって伸ばしていきます。具体的には、両手の親指で葉の縁の表側を押さえ、残りの8本の指で裏側を支えながら、葉を伸ばすと同時に指で押しならし、平らに整えます。',
          ],
          [
            'Sau khi rẽ xong những người cẩn thận hơn sẽ tiến hành hun lá thêm một lần nữa. Để bảo quản trước khi đưa vào làm nón, lá được bọc kín nhằm tránh bị khô, đồng thời nguyên tắc làm đến đâu sẽ lấy ra đến đó.',
            'この作業を終えた後、さらに丁寧に仕上げる職人は、葉をもう一度煙でいぶします。ノンラーの製作に使用するまで葉が乾燥しないよう、しっかりと包んで{保管|ほかん}し、作業に必要な分だけその都度取り出します。',
          ],
        ],
        image: ['Tay nghệ nhân rẽ từng chiếc lá', '葉を一枚ずつのばす職人の手'],
      },
      {
        no: 2,
        name: ['Là lá', 'ラー・ラー'],
        sub: ['ủi phẳng lá bằng nhiệt', '熱を加えて葉を平らに伸ばす作業'],
        text: [
          [
            'Công đoạn là lá giúp lá nón phẳng phiu, mềm dẻo và giữ được màu sắc tự nhiên. Hiện nay, người thợ sử dụng bếp điện để điều chỉnh và giữ nhiệt độ ổn định thay cho cách đốt củi truyền thống.',
            '「ラー・ラー」は、ノンラー用の葉を平らで柔らかくし、自然な色合いを保つための工程です。現在では、従来の薪を燃やす方法に{代|か}わり、電気コンロを使用して温度を調節し、{一定|いってい}に保っています。',
          ],
          [
            'Một chiếc lưỡi cày bằng gang (hoặc tấm kim loại phẳng) được đặt lên bếp điện để tạo bề mặt miết lá. Trước khi làm, thợ dùng một bọc vải nhỏ xoa đều lên bề mặt kim loại để làm sạch và kiểm tra mức nhiệt. Khi tiến hành, thợ một tay giữ tệp lá đưa lên bề mặt kim loại nóng, tay kia cầm bọc vải miết lực vừa đủ và kéo đều tay cho đến khi lá phẳng mịn.',
            '{鋳鉄|ちゅうてつ}製の犂先、または平らな金属板を電気コンロの上に置き、葉を伸ばすための作業面として使用します。作業を始める前に、職人は小さな布の包みで金属の表面を均一にこすり、表面をきれいにするとともに、温度を確認します。作業中は、片手で葉の束を持って熱した金属の表面に当て、もう一方の手で布の包みを持ち、適度な力を加えながら均一に滑らせます。この動作を葉が平らで滑らかになるまで続けます。',
          ],
          [
            'Công đoạn này đòi hỏi sự khéo léo trong việc canh chỉnh nhiệt độ bếp điện: nếu nhiệt quá cao, lá (đặc biệt là lá lụi mỏng) sẽ bị đỏ và giòn; ngược lại, nếu nhiệt quá thấp, lá sẽ không đủ độ phẳng và dễ bị quăn trở lại.',
            'この工程では、電気コンロの温度を適切に調節する技術が求められます。温度が高すぎると、特に薄いラルイは赤みを帯びてもろくなります。一方、温度が低すぎると、葉を十分に平らにすることができず、再び反り返りやすくなります。',
          ],
        ],
        image: ['Miết phẳng lá trên mặt gang nóng', '熱い鉄板で葉をのばす'],
      },
      {
        no: 3,
        name: ['Bứt vòng', 'ブット・ヴォン'],
        sub: ['làm khung vành', 'ノンラーの輪をつなぎ、骨組みを作る作業'],
        text: [
          [
            'Công đoạn nối và lắp các vòng nón đòi hỏi sự khéo léo để tạo ra một khung nón tròn trịa và chuẩn xác. Mặc dù các vòng nón mua về từ làng nghề đã được vót sẵn khá đẹp, người thợ vẫn cần kiểm tra lại, dùng dao gọt giũa những chỗ chưa đều và làm mỏng hai đầu để khi nối lại sẽ tạo thành một đường liền mạch, phẳng mịn. Sau đó, thợ sẽ ướm từng vòng lên khung gỗ để đánh dấu và căn chỉnh kích thước. Việc căn chỉnh này rất quan trọng: nếu làm quá chặt thì khung nón sẽ bị méo thành hình nhiều cạnh thay vì hình tròn, còn nếu lỏng quá thì khoảng cách giữa các vòng sẽ không đều nhau.',
            'この工程では、ノンラーの輪をつなぎ合わせて型にはめ込み、丸く正確な骨組みを作ります。そのためには、職人の{器用|きよう}さが求められます。伝統工芸村から仕入れた輪は、すでに丁寧に削られ、形も整えられています。しかし、職人は一つひとつの輪を改めて確認し、形が不均一な部分をナイフで削って整えます。また、両端を薄く{削|けず}り、つなぎ合わせたときに継ぎ目が目立たず、滑らかになるようにします。その後、輪を一本ずつ木製の型に当てて位置を確認し、{印|しるし}を付けながら大きさを調整します。この調整は非常に重要です。輪をきつくはめすぎると、骨組みが円形ではなく多角形に変形してしまいます。一方、緩すぎると、輪と輪の間隔が不均一になります。',
          ],
          [
            'Tổng cộng có 16 vòng được đưa lần lượt vào khung theo một thứ tự nhất định, từ vòng cạp lớn ở miệng nón cho đến các vòng ở thân và chóp. Mỗi loại vòng sẽ có cách xử lý riêng; ví dụ như các vòng ở thân nón thường được vuốt qua bằng miếng vải để trở nên mềm, cong và mịn hơn. Trong các bước thì phần nối vòng cạp là khó nhất vì vòng này to, cứng và rất khó uốn tròn. Những người thợ lành nghề sẽ dùng cước trắng chuyên dụng để buộc nối thật chặt, khít và mịn màng, sao cho điểm nối giáp vào nhau hoàn toàn tự nhiên. Đây được xem là một trong những kỹ thuật khéo léo nhất của nghề làm nón, thường được các thiếu niên khoảng 14–15 tuổi bắt đầu học và thực hành.',
            '全部で16本の輪を、ノンラーの開口部にある大きな外縁の輪から、胴部、頂点付近の輪へと、決められた順序に従って型にはめ込んでいきます。輪の種類によって加工方法も異なります。例えば、胴部に使用する輪は、布で表面をなでるようにこすり、より柔らかく、曲がりやすく、滑らかな状態に整えます。なかでも、外縁の大きな輪をつなぎ合わせる作業が最も難しいとされています。この輪は大きくて硬く、きれいな円形に曲げることが難しいためです。熟練した職人は専用の白いナイロン糸を使い、両端をしっかりと密着させて結びつけ、継ぎ目が自然で滑らかに見えるように仕上げます。これはノンラー作りのなかでも特に熟練を要する技術の一つとされ、14～15歳頃の少年少女が練習を始めることが多い作業です。',
          ],
        ],
        image: ['Khuôn nón — nơi đặt lần lượt 16 vành nứa', '16本のヌアの輪を順にはめていくノンラーの製作型'],
      },
      {
        no: 4,
        name: ['Quay nón', 'クアイ・ノン'],
        sub: ['lợp nón — xếp lá lên khung nón', '型に葉を重ねてかぶせる作業'],
        text: [
          [
            'Công đoạn quay nón (lợp nón) là quá trình tạo nên cấu trúc nhiều lớp cho chiếc nón, bao gồm hai lớp lá bọc ngoài và một lớp mo ở giữa.',
            '「クアイ・ノン」は、ノンラーの三層構造を作る工程です。内側と外側にそれぞれ一層ずつラルイを重ね、その間に一層のモーナンを挟み込みます。',
          ],
          [
            'Đầu tiên, người thợ thực hiện lớp lá thứ nhất bằng cách chọn những tàu lá có phần thịt trắng trong, gân nhỏ và màu sắc đều nhau. Khoảng 17 đến 18 tàu lá được xếp chồng lên nhau, cắt phần mép, rồi cố định bằng một chiếc kim cắm ở đỉnh chóp và trải đều xung quanh khung. Tiếp theo, họ dùng dây gai chằng chéo để giữ chặt lá ở phần thân nón, đồng thời khéo léo chèn thêm các mẩu lá nhỏ vào các khoảng trống để bề mặt nón trở nên phẳng mịn.',
            'まず、一層目には、葉肉が白く{透|す}き{通|とお}り、葉脈が細く、色むらのない葉を選びます。約17～18枚の葉を重ねて縁を切りそろえ、頂点に刺した針で固定した後、型の周囲に均等に広げます。次に、{麻|あさ}ひもを交差させながら胴部の葉をしっかりと固定します。同時に、葉と葉の間にできた隙間には小さな葉片を丁寧に差し込み、ノンラーの表面が平らで滑らかになるように整えます。',
          ],
          [
            'Sau lớp lá đầu tiên, người thợ tiếp tục lợp lớp mo ở giữa, gồm 5 tàu mo có kích thước đều nhau. Phần mo được cắt và gọt mỏng ở mép để khi xếp nối tiếp không bị cộm, với mặt phẳng mịn được quay vào trong. Lớp mo này cũng được chằng buộc bằng dây gai, sau đó sợi dây chằng của lớp lá thứ nhất sẽ được rút ra.',
            '一層目の葉をかぶせた後、中央にモーナンの層を重ねます。この層には、大きさのそろった5枚のモーナンを使用します。モーナンは縁を切りそろえて薄く削り、重ねた部分が盛り上がらないようにします。また、滑らかな{面|めん}を内側に向けて配置します。モーナンの層も麻ひもで固定します。その後、一層目の葉を固定していたひもを引き{抜|ぬ}きます。',
          ],
          [
            'Cuối cùng, lớp lá thứ hai được lợp tương tự như lớp đầu tiên, nhưng điểm khác biệt là mặt phải của lá sẽ quay ra ngoài. Khi hoàn thành lớp thứ hai, nón lại được chằng buộc cẩn thận, rút dây chằng mo ra để chuẩn bị chuyển sang công đoạn khâu.',
            '最後に、二層目の葉を一層目と同じようにかぶせます。ただし、二層目では葉の表側を外側に向けます。葉を重ね終えたら、再びひもで丁寧に固定し、モーナンを押さえていたひもを引き抜いて、次の縫い付け工程に備えます。',
          ],
        ],
        image: ['Xếp từng lớp lá lụi lên khuôn', 'ラルイを一枚ずつ型に重ねる'],
      },
      {
        no: 5,
        name: ['Khâu nón', 'カウ・ノン'],
        // bản dịch nhóm 06/11: tên bước = phiên âm (カウ・ノン), phụ đề = việc làm; "タット・ノン" chỉ còn trong thân bài
        sub: ['thắt nón', '葉とモーナンを輪に縫い付ける作業'],
        text: [
          [
            'Công đoạn khâu nón (thắt nón) là bước dùng kim và sợi cước để gắn chặt các lớp lá và lớp mo vào vòng nón. Quá trình này được tiến hành theo thứ tự từ trên đỉnh chóp xuống dưới vành cạp.',
            '「カウ・ノン」は、針とナイロン糸を使い、葉の層とモーナンの層をノンラーの輪にしっかりと縫い付ける工程です。縫い付けは、ノンラーの頂点から下部の外縁に向かって順番に進めます。',
          ],
          [
            'Khi ngồi khâu, người thợ đặt nghiêng khung nón giữa hai đầu gối để làm điểm tựa; tay trái đặt ở bên trong lòng nón còn tay phải giữ ở phía ngoài mặt nón, dùng ngón cái và ngón trỏ để cầm kim. Thao tác khâu diễn ra vô cùng nhịp nhàng, nhanh gọn và dứt khoát; tay phải đưa mũi kim đâm từ trên xuống, đồng thời tay trái ở bên dưới đón mũi kim rồi đâm ngược trở lại, vừa gạt sợi cước sang một bên vừa kéo mũi khâu thật chặt và mịn. Khi khâu nón thì kim phải đâm nghiêng, nếu đâm thẳng thì sẽ đâm vào sợi vòng, các cụ ngày xưa gọi là thắt nón. Đây là công đoạn quan trọng nhất vì nó sẽ quyết định độ chắc và đẹp của nón.',
            '職人は、ノンラーの型を両膝の間に{斜|なな}めに置いて支えます。左手をノンラーの内側に、右手を外側に置き、親指と人差し指で針を持ちます。縫う動作は、リズムよく、素早く、正確に行われます。右手で針を上から下へ刺し、内側にある左手で針先を受け取り、再び反対方向へ刺し戻します。その際、ナイロン糸を脇に寄せながら、一針一針をしっかりと引き締め、滑らかに仕上げます。針は輪に対して斜めに刺す必要があります。まっすぐに刺すと、輪を作る材料に針が当たってしまうためです。昔の職人たちは、この作業を「タット・ノン」と呼んでいました。この工程は、ノンラーの丈夫さと美しさを左右する最も重要な工程です。',
          ],
          [
            'Nhờ sự khéo léo của người thợ, khoảng cách giữa các mũi khâu đều tăm tắp như được máy làm, các mũi kim đâm từ dưới lên khớp hoàn hảo với mũi từ trên xuống, giúp 16 vòng nón dần hiện lên duyên dáng. Thậm chí, cách giấu mối nối cước cũng khéo léo đến mức thoạt nhìn trông giống như một sợi cước dài vô tận. Sau khi khâu xong, người thợ tiến hành tháo dây chằng, nhấc nón ra khỏi khung và dùng kéo cắt bỏ phần lá thừa xung quanh, với nguyên tắc cắt càng sát vòng cạp thì vành nón trông sẽ càng đẹp.',
            '職人の巧みな技術によって、縫い目の間隔はまるで機械で縫ったかのように均一になります。下から刺した針の位置も上から刺した針の位置と正確に{合|あ}い、16本の輪が次第に美しく{浮|う}かび上がります。さらに、ナイロン糸の継ぎ目も巧みに隠され、一見すると一本の長い糸で縫い続けているように見えます。縫い終えたら、固定用のひもを外し、ノンラーを型から取り出します。その後、はさみで周囲の余分な葉を切り落とします。このとき、外縁の輪にできるだけ近い位置で切るほど、縁が美しく仕上がるとされています。',
          ],
        ],
        image: ['Cận cảnh mũi kim, sợi cước xuyên qua lớp lá', '葉の層を通る針と糸のクローズアップ'],
      },
      {
        no: 6,
        name: ['Nức nón', 'ヌック・ノン'],
        sub: ['khâu viền mép nón', 'ノンラーの外縁を縫って{補強|ほきょう}する作業'],
        text: [
          [
            'Sau khi nón đã được khâu xong và cắt bỏ phần lá thừa sát vòng cạp, người thợ tiến hành dùng cước hoặc sợi liếc chuyên dụng để khâu bọc, nức cố định kỹ phần cạp nón. Công đoạn này giúp che đi các mép cắt thô, đồng thời gia cố giúp vành nón trở nên chắc chắn, cứng cáp và giữ được dáng chuẩn. Các mũi khâu mép đòi hỏi sự đều đặn, khít và mịn màng để tạo nên độ thẩm mỹ tinh xảo, sắc nét cho toàn bộ chiếc nón trước khi đưa ra sử dụng.',
            'ノンラー全体を縫い終え、外縁の輪に{沿|そ}って余分な葉を切り落とした後、職人はナイロン糸または専用のリエックの繊維を使い、外縁を包み込むように縫って、しっかりと固定します。この工程では、切り口の{粗|あら}い部分を覆うとともに、外縁を補強し、丈夫さと硬さを高めて、ノンラーの形を{保|たも}ちます。縁を縫う際には、縫い目の間隔が均一で、隙間なく、滑らかに仕上がることが求められます。これにより、使用前のノンラー全体に、細部まで整った美しい仕上がりを与えます。',
          ],
        ],
        image: ['Cắt lá thừa và khâu viền vành nón', '余分な葉を切り、外縁を縫う'],
      },
      {
        no: 7,
        name: ['Luồn nhôi', 'ルオン・ノイ'],
        sub: ['luồn chỉ khâu cố định lá vào vành', 'あごひもを通して固定する部分を色糸で作る作業'],
        text: [
          [
            'Trong quy trình làm nón, luồn nhôi (hay làm nhôi nón) là công đoạn hoàn thiện cuối cùng rất quan trọng để gắn và cố định phần quai nón.',
            '「ルオン・ノイ（ノイを作る作業）」は、ノンラーのあごひもを取り付け、固定するための重要な最終工程です。',
          ],
          [
            'Sau khi chiếc nón đã được khâu và nức vành chắc chắn, người thợ sẽ sử dụng những sợi chỉ màu thường có 3 màu xanh, đỏ hoặc trắng để đan, luồn vào bên trong thành nón, tạo thành chiếc quai treo chắc chắn giúp người đội giữ được nón trên đầu. Công đoạn này đòi hỏi sự khéo léo để vừa đảm bảo độ bền chặt, vừa tạo nét trang trí trang nhã, làm điểm nhấn thẩm mỹ cho chiếc nón trước khi đưa sang bước quét dầu bóng bảo vệ hoàn thiện sản phẩm.',
            'ノンラー全体を縫い、外縁もしっかりと補強した後、職人は通常、青・赤・白の3色の糸を使います。これらの糸を編み、ノンラーの内側に通して、あごひもを取り付けるための丈夫な留め具を作ります。これにより、着用時にノンラーを頭に固定できるようになります。この工程では、丈夫さを確保すると同時に、装飾としての上品な美しさも生み出すため、職人の器用さが求められます。こうしてノンラーに美しいアクセントを加えた後、製品の仕上げとして、表面に保護用の油を塗る作業へと進みます。',
          ],
        ],
        image: ['Chỉ màu luồn trong lòng nón', 'ノンラーの内側に通した色糸'],
      },
    ],
    finish: {
      label: ['Xử lý hoàn thiện sản phẩm', '製品の仕上げ処理'],
      name: ['Quang dầu', 'クアン・ザウ'],
      sub: ['phủ lớp dầu bóng chống thấm nước', '防水のために表面に保護用の油を塗る作業'],
      text: [
        [
          'Người thợ chuẩn bị một loại dầu chuyên dụng (thường là dầu thông hoặc dầu bóng pha loãng) cùng với một chiếc chổi lông mềm, mịn để thực hiện thao tác quét.',
          '職人は、専用の油（通常は松根油や薄めたつや出し用の油）と、毛先が柔らかくきめ細かい{刷毛|はけ}を用意します。',
        ],
        [
          'Chiếc nón sau khi đã được nức và cắt tỉa gọn gàng, người thợ nhúng chổi vào dung dịch dầu, gạt bớt phần thừa để chổi chỉ ẩm đều, sau đó quét nhẹ nhàng và đều tay từ đỉnh chóp nón tỏa ra các hướng xuống tận vành dưới. Thao tác đòi hỏi sự tỉ mỉ, khéo léo để lớp dầu phủ lên bề mặt lá phải thật mỏng, đều và nhẵn mịn, tuyệt đối không để dầu bị vón cục, đọng vũng hay loang lổ chỗ dày chỗ mỏng.',
          '外縁の縫い付けと余分な葉の切りそろえを終えたノンラーに、油を塗っていきます。まず、刷毛を油に浸し、余分な油を落として、刷毛全体に適度に含ませます。その後、ノンラーの頂点から下部の外縁に向かって、各方向へ軽く均一に{塗|ぬ}り広げます。この作業には{細|こま}やかな注意と器用さが求められます。葉の表面を覆う油の層が薄く、均一で滑らかになるように塗り、油が{固|かた}まったり、一か所にたまったり、厚さにむらができたりしないようにします。',
        ],
        [
          'Công đoạn này tạo ra một lớp màng bảo vệ trong suốt giúp nón ngăn ngừa ẩm mốc, giữ cho màu sắc của lá luôn trắng sáng đẹp theo thời gian, đồng thời làm tăng thêm độ bóng bẩy và độ bền chắc cho chiếc nón lá truyền thống. Sau khi quét xong, nón được mang ra phơi ở nơi thoáng gió, có nắng nhẹ cho đến khi lớp dầu khô hoàn toàn.',
          'この工程によって、ノンラーの表面に{透明|とうめい}な保護膜が形成され、湿気やカビの発生を防ぎます。また、葉の明るい白色を長く保つとともに、伝統的なノンラーの光沢と耐久性を高めます。油を塗り終えたら、風通しがよく、日差しの弱い場所で、油の層が完全に乾くまで干します。',
        ],
      ],
      image: ['Quét dầu bóng và phơi nón', '油を塗ってノンラーを干す'],
    },
  },
}
