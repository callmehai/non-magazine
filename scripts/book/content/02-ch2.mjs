/**
 * Chương 2 — Cấu tạo, nguyên liệu và kỹ thuật làm nón Làng Chuông. Mỗi đoạn: [tiếng Việt, tiếng Nhật]
 * Tiếng Việt: nguyên văn tab "Chương 2" (Doc "ND + HT - Nón lá đã sửa", bản sửa lần 1); tiếng Nhật: bản dịch tạm.
 */
export const ch2 = {
  no: 2,
  label: ['Chương 2', '第2{章|しょう}'],
  title: ['Cấu tạo, nguyên liệu và\nkỹ thuật làm nón Làng Chuông', 'チュオン{村|むら}のノンラーの\n{構造|こうぞう}・{材料|ざいりょう}・{製作技術|せいさくぎじゅつ}'],
  lead: [
    'Nhắc đến Làng Chuông là nhắc đến mảnh đất với những chiếc nón lá bền đẹp nổi danh khắp trong và ngoài nước. Tuy nhiên, để tạo nên một sản phẩm vừa mang tính ứng dụng cao vừa đạt đến giá trị thẩm mỹ tinh tế, đó là cả một nghệ thuật đòi hỏi sự kết hợp nhuần nhuyễn giữa nhiều yếu tố cốt lõi: từ khâu tuyển chọn nguyên liệu tự nhiên, kỹ thuật xử lý tỉ mỉ qua từng công đoạn, cho đến kinh nghiệm tích lũy và đôi bàn tay khéo léo của người thợ thủ công.',
    'チュオン村といえば、{丈夫|じょうぶ}で美しいノンラーで国内外に名を知られる土地です。しかし、実用性と{洗練|せんれん}された美しさを{兼|か}ね{備|そな}えた笠を生み出すことは、いくつもの大切な{要素|ようそ}を{巧|たく}みに組み合わせる一つの芸術です。天然材料の{厳選|げんせん}から、各工程の{丁寧|ていねい}な{処理|しょり}、そして職人が{積|つ}み{重|かさ}ねてきた経験と{器用|きよう}な手まで、そのどれもが{欠|か}かせません。',
  ],
  // chương mở đầu bằng ba đoạn dẫn: đoạn 1 ở trang mở chương, hai đoạn sau đầu nội dung
  intro: [
    [
      'Nhằm giúp người đọc có cái nhìn toàn diện và sâu sắc hơn về hành trình hình thành nên chiếc nón lá truyền thống, Chương 2 sẽ tập trung giới thiệu chi tiết từng khía cạnh trong quy trình chế tác tại Làng Chuông. Nội dung chương bắt đầu bằng việc trình bày đặc điểm cấu tạo 3 lớp đặc trưng của nón, tiếp đó giới thiệu hệ thống nguyên liệu đầu vào như lá nón, vòng tre, chỉ khâu, và đi sâu vào từng bước trong quy trình kỹ thuật thủ công từ sơ chế lá, uốn vành, khâu nón cho đến giai đoạn hoàn thiện sản phẩm.',
      '伝統的なノンラーができあがるまでの{道|みち}のりを、より{幅広|はばひろ}く深く理解していただくために、第2章ではチュオン村での製作工程を一つひとつ詳しく紹介します。まずノンラー特有の三層構造を説明し、次に葉、竹の輪、縫い糸などの材料を紹介したうえで、葉の下ごしらえ、輪づくり、縫い付けから仕上げまで、手仕事の工程を順に見ていきます。',
    ],
    [
      'Thông qua việc kết nối giữa yếu tố vật liệu, cấu trúc và thao tác kỹ thuật, chương này không chỉ phác họa rõ nét bức tranh toàn cảnh về quy trình sản xuất nón Làng Chuông, mà còn tôn vinh giá trị lao động đã được gìn giữ qua nhiều thế hệ.',
      '材料・構造・技術を結びつけて見ることで、この章はチュオン村の笠づくりの全体像を描き出すとともに、何世代にもわたって守られてきた{労働|ろうどう}の価値をたたえます。',
    ],
  ],

  // ── 2.1
  structure: {
    id: '2.1',
    title: ['Cấu tạo của nón lá Làng Chuông', 'チュオン村のノンラーの構造'],
    intro: [
      'Nón lá Làng Chuông gồm hai phần chính: phần lá lợp và phần khung nón. Phần lá lợp tạo nên bề mặt bên ngoài và bên trong của nón, trong khi phần khung giúp định hình dáng chóp và nâng đỡ thân nón. Sự kết hợp giữa hai phần tạo nên chiếc nón có vẻ ngoài thanh mảnh nhưng vẫn chắc chắn, và độ bền cao trong quá trình sử dụng.',
      'チュオン村のノンラーは、「{葺|ふ}き{葉|ば}」と「{骨組|ほねぐ}み」の二つの部分からできています。葺き葉は笠の{外側|そとがわ}と{内側|うちがわ}の{面|めん}をつくり、骨組みは円錐の形を{保|たも}って笠全体を{支|ささ}えます。この二つが合わさることで、{細身|ほそみ}で軽やかに見えながらも、丈夫で長持ちする笠になるのです。',
    ],
    parts: [
      [['Phần lá lợp', '葺き葉'], ['Gồm ba lớp vật liệu xếp chồng lên nhau, bao gồm lớp lá lụi bên ngoài, lớp mo nang ở giữa và lớp lá lụi bên trong. Các lớp này góp phần che chắn, tạo độ ổn định và hoàn thiện bề mặt nón.', '外側のライ葉、中間のモーナン（竹皮）、内側のライ葉という三層の材料を重ねたものです。これらの層が日差しや雨を{防|ふせ}ぎ、笠を安定させ、表面を{仕上|しあ}げます。']],
      [['Phần khung nón', '骨組み'], ['Gồm 16 vành nứa có đường kính giảm dần từ đáy lên chóp. Các vành được sắp xếp theo dáng nón, giúp định hình và nâng đỡ phần lá lợp.', '下から頂に向かって直径が小さくなる、16本のヌア竹の輪からなります。輪は笠の形に{沿|そ}って{並|なら}び、形を整え、葺き葉を支えます。']],
    ],
    layers: {
      id: '2.1.1',
      h: ['Cấu trúc lợp lá ba lớp', '三層の{葺|ふ}き{構造|こうぞう}'],
      intro: [
        'Nón lá Làng Chuông sử dụng cấu trúc lợp ba lớp vật liệu xếp chồng lên nhau, gồm lớp lá lụi bên ngoài, lớp mo nang ở giữa và lớp lá lụi bên trong. Mỗi lớp đảm nhiệm một chức năng riêng, góp phần tạo nên độ bền và tính thẩm mỹ của chiếc nón.',
        'チュオン村のノンラーは、外側のライ葉、中間のモーナン、内側のライ葉という三層の材料を重ねて葺く構造になっています。それぞれの層が{独自|どくじ}の{役割|やくわり}を{担|にな}い、笠の丈夫さと美しさを生み出しています。',
      ],
      items: [
        [['Lớp lá lụi (lớp ngoài)', 'ライ葉（外層）'], ['Sử dụng lá lụi trắng, có đặc điểm mỏng, dài và màu sắc sáng tương đối đồng đều. Đây là lớp tiếp xúc trực tiếp với môi trường bên ngoài, có tác dụng che nắng, mưa và tạo diện mạo cho chiếc nón.', '白いライ葉を使います。薄くて長く、明るい色がよくそろっているのが特徴です。外の{環境|かんきょう}に{直接|ちょくせつ}{触|ふ}れる層で、日差しや雨を防ぎ、笠の{表情|ひょうじょう}をつくります。']],
        [['Lớp mo nang (lớp giữa)', 'モーナン（中層）'], ['Nằm giữa hai lớp lá lụi, có tác dụng làm lớp đệm, tăng độ chắc chắn và hỗ trợ duy trì hình dáng thân nón. Nhờ lớp mo nang, phần lá lợp có độ dày cần thiết mà vẫn giữ được đặc điểm nhẹ của sản phẩm.', '二層のライ葉の間に入り、{緩衝材|かんしょうざい}として笠を{補強|ほきょう}し、{胴|どう}の形を保つ{助|たす}けをします。モーナンのおかげで、葺き葉は必要な{厚|あつ}みをもちながらも、軽さを{失|うしな}いません。']],
        [['Lớp lá lụi (lớp trong)', 'ライ葉（内層）'], ['Nằm ở mặt trong của nón, có tác dụng che phủ lớp mo nang, hoàn thiện lòng nón và tạo bề mặt gọn gàng. Lớp này góp phần bảo vệ phần vật liệu bên trong, đồng thời tăng tính thẩm mỹ cho sản phẩm.', '笠の内側にあり、モーナンを{覆|おお}って内側を仕上げ、すっきりとした面をつくります。中の材料を守ると同時に、製品の美しさも高めます。']],
      ],
      // một dòng tóm tắt cho mô hình 3D ba lớp (bấm vào lớp nào thì lớp đó sáng màu)
      short: [
        ['Che nắng, che mưa và tạo diện mạo cho nón', '日差しや雨を防ぎ、笠の表情をつくる'],
        ['Lớp đệm giúp nón chắc chắn, giữ dáng mà vẫn nhẹ', '笠を丈夫にし、軽さを保ったまま形を支える'],
        ['Che lớp mo nang, hoàn thiện lòng nón', 'モーナンを覆い、笠の内側を仕上げる'],
      ],
      outro: [
        'Như vậy, ba lớp vật liệu có chức năng bổ trợ cho nhau trong cấu tạo của nón lá Làng Chuông. Lớp lá ngoài đảm nhiệm việc che chắn và tạo bề mặt, lớp mo nang góp phần tăng độ chắc chắn, còn lớp lá trong giúp hoàn thiện mặt trong của nón. Sự kết hợp này tạo nên phần lá lợp vừa nhẹ nhàng, vừa có độ ổn định cần thiết trong quá trình sử dụng.',
        'このように、三層の材料はチュオン村のノンラーの構造の中で{互|たが}いに{補|おぎな}い合っています。外の葉は守りと表面を、モーナンは強さを、内の葉は内側の仕上げを担います。この組み合わせによって、軽く、しかも使うときに必要な安定さをもつ葺き葉ができあがるのです。',
      ],
      image: ['Chiếc nón đang lợp dở: lớp mo nang lộ ra giữa các lớp lá', '葺きかけの笠：葉の間からモーナンの層がのぞく'],
    },
    frame: {
      id: '2.1.2',
      h: ['Cấu trúc khung 16 vòng', '16{本|ほん}の{輪|わ}の骨組み'],
      p: [
        [
          'Phần khung nón Làng Chuông gồm 16 vòng được làm bằng nứa, có chức năng định hình, nâng đỡ lớp lá và duy trì dáng chóp của nón. Các vành được bố trí từ dưới lên trên, với đường kính giảm dần theo độ thuôn của thân nón. Phần vành dưới có kích thước lớn hơn, tạo độ rộng cho nón, trong khi các vành phía trên nhỏ dần để hình thành độ dốc và phần chóp nhọn.',
          'チュオン村のノンラーの骨組みは、ヌア竹で作った16本の輪からなり、形を整え、葉を支え、円錐の形を保つ役割をもっています。輪は下から上へ、笠の{傾斜|けいしゃ}に合わせて直径が少しずつ小さくなるように配置されます。下の大きな輪が笠の広がりをつくり、上の小さな輪が{勾配|こうばい}ととがった頂をつくります。',
        ],
      ],
      note: [
        'Chú thích: Cây nứa – nguyên liệu được sử dụng để làm vành nón Làng Chuông. Loài cây cùng họ với tre, thân mỏng, gióng dài, thường mọc thành bụi ở rừng. Thân cây nứa đã chặt, chẻ ra, dùng để đan phên, đan lát hoặc làm đồ thủ công; thanh nứa rất dẻo, thích hợp để đan rổ, sàng.',
        '{注|ちゅう}：ヌア竹 ― チュオン村の笠の輪に使われる材料です。竹の{仲間|なかま}で、{幹|みき}が{薄|うす}く{節|ふし}と節の間が長く、森に{群生|ぐんせい}します。切って{割|わ}った幹は、{壁|かべ}や{編|あ}み{物|もの}、手工芸品に使われます。とてもしなやかで、{籠|かご}やふるいを編むのに{適|てき}しています。',
      ],
      after: [
        [
          'Nứa được sử dụng làm vành nhờ đặc tính nhẹ, dai và có độ đàn hồi phù hợp, giúp khung nón vừa chắc chắn vừa không làm tăng đáng kể trọng lượng sản phẩm. Khoảng cách và vị trí của các vành cần được bố trí tương đối đều để tạo sự cân đối giữa phần vành, thân và chóp nón. Cách sắp xếp này cũng giúp lớp lá được nâng đỡ trên toàn bộ bề mặt, góp phần duy trì hình dáng ổn định sau khi hoàn thiện.',
          'ヌア竹が輪に使われるのは、軽くてねばりがあり、ほどよい{弾力|だんりょく}をもつためです。骨組みを丈夫にしながら、笠をほとんど重くしません。輪の間隔と位置はほぼ{均等|きんとう}にし、つば・胴・頂の{釣|つ}り{合|あ}いをとります。こうすることで葉が面全体で支えられ、仕上がったあとも形が安定します。',
        ],
        [
          'Bên cạnh cách bố trí các vành, việc xử lý các điểm nối cũng ảnh hưởng đến độ đều của khung nón. Các mối nối cần được làm gọn, hạn chế những chỗ nhô cao hoặc gồ ghề để không ảnh hưởng đến quá trình lợp lá và chằm nón. Khi các vành nứa được sắp xếp cân đối và liên kết chắc chắn, phần khung tạo nền tảng cho lớp lá lợp, góp phần làm nên chiếc nón Làng Chuông có dáng chóp thanh mảnh nhưng vẫn chắc chắn và bền trong quá trình sử dụng.',
          '輪の配置に加え、つなぎ目の処理も骨組みのそろい{具合|ぐあい}を{左右|さゆう}します。つなぎ目は小さくまとめ、出っ{張|ぱ}りや{凹凸|おうとつ}をできるだけなくして、葉を葺いたり縫ったりする作業の{妨|さまた}げにならないようにします。ヌア竹の輪が{均整|きんせい}よく並び、しっかりとつながると、骨組みは葺き葉の{土台|どだい}となり、細身でありながら丈夫で長持ちするチュオン村のノンラーが生まれるのです。',
        ],
      ],
      image: ['Nghệ nhân Lê Văn Tuy nối vành nứa vào khung nón', 'ヌア竹の輪を骨組みにつなぐ職人レー・ヴァン・トゥイ'],
    },
  },

  // ── 2.2
  materials: {
    id: '2.2',
    title: ['Nguyên liệu và dụng cụ làm nón lá', 'ノンラーづくりの材料と道具'],
    items: [
      [['Lá lụi (lá cọ non)', 'ライ葉（若いヤシの葉）'], ['Là loại lá khô, chủ yếu được nhập từ các tỉnh miền Trung như Thanh Hóa, Nghệ An. Khi tới các làng nghề (như làng nón Chuông), hình ảnh những triền đê phủ đầy lá lụi phơi nắng đã trở nên quen thuộc.', '乾燥させた葉で、主にタインホア、ゲアンなど中部の{省|しょう}から{仕入|しい}れます。チュオン村のような工芸村を訪れると、{堤防|ていぼう}一面にライ葉が干されている光景がおなじみです。'], ['Búp lá cọ non phơi khô, màu trắng ngà', '干した若いヤシの葉（象牙色）']],
      [['Thanh nứa', 'ヌア竹'], ['Được chuốt vót công phu thành những sợi mảnh, tròn đều rồi uốn nối lại thành các vòng nón với kích thước từ nhỏ đến lớn. Đây chính là phần khung xương giúp định hình dáng nón.', '手間をかけて細く丸く{削|けず}り、曲げてつなぎ、小さなものから大きなものまでの輪にします。これが笠の形を決める骨組みになります。'], ['Các thanh nứa vót mỏng', '細く削ったヌア竹']],
      [['Mo nang (lớp mo nứa)', 'モーナン（ヌア竹の皮）'], ['Được đặt làm lớp giữa các lớp lá, giúp chiếc nón giữ được độ chắc chắn và cứng cáp.', '葉の層の間に入れ、笠を丈夫で{張|は}りのあるものにします。'], ['Lớp mo nang', 'モーナン']],
      [['Sợi cước', 'ナイロン{糸|いと}'], ['Trước đây, nón được làm bằng sợi móc và sợi dứa làm từ cây móc và cây dứa nhưng từ đầu những năm 80, đã được thay bằng sợi cước nhờ tính thẩm mỹ, độ bền và tiện lợi. Cước có nhiều kích cỡ và được bán theo lạng hoặc mua cả guổng (1 kg). Thường được mua tại Chợ Chuông có khu vực chuyên bán cước và các dụng cụ làm nón.', 'かつてはモック（ヤシの{一種|いっしゅ}）やパイナップルの{繊維|せんい}で作った糸で縫っていましたが、1980年代初めから、美しく丈夫で{扱|あつか}いやすいナイロン糸に{代|か}わりました。太さはさまざまで、100グラム{単位|たんい}か、1キロの{巻|ま}きで売られます。ナイロン糸や笠づくりの道具を{専門|せんもん}に売る{一角|いっかく}があるチュオン市場で買うのが一般的です。'], ['Cuộn sợi cước', 'ナイロン糸の巻き']],
      [['Liếc (cây lòng bông)', 'リエック'], ['Liếc (hay cây lòng bông thuộc họ dương xỉ) do người làng Lưu Thượng (Phú Xuyên) cung cấp, bán theo bó khoảng 100 cây để tách ruột và vỏ làm nón. Trong đó, phần ruột (guột) dùng để buộc nối đầu sợi vòng giúp chiếc nón mịn màng, hài hòa; còn phần vỏ cứng, bóng, màu nâu sẫm được chẻ đôi khâu cùng vòng nứa để cạp nón thêm chắc chắn.', 'リエック（シダの{仲間|なかま}）は、ルウトゥオン村（フースエン）の人々が{届|とど}けるもので、約100本の束で売られ、{芯|しん}と皮に分けて使います。芯（グオット）は輪の{端|はし}を結んでつなぎ、笠を滑らかで{調和|ちょうわ}のとれたものにします。{硬|かた}く{艶|つや}のある{焦|こ}げ{茶|ちゃ}色の皮は二つに割り、ヌア竹の輪と一緒に縫い付けて、つばを{補強|ほきょう}します。'], ['Cây liếc — ruột và vỏ', 'リエック：芯と皮']],
      [['Sợi luồn nhôi (sợi chỉ màu)', 'ニョイの{色糸|いろいと}'], ['Dùng để tạo và cố định giữ chắc phần quai nón khi sử dụng.', 'あごひもを{取|と}り{付|つ}ける部分を作り、使うときにしっかり{固定|こてい}します。'], ['Sợi chỉ màu', '色糸']],
    ],
    tools: [
      [
        ['Khuôn nón', '笠の{型|かた}'],
        [
          'Khuôn nón tạo ra dáng nón. Dáng nón thanh thoát, nhẹ nhàng, được quyết định bởi khuôn nón ("Nón tốt nhờ khuôn"). Một khuôn nón gồm 8 thanh (gọng) và 01 vòng cạp, mỗi thanh đều có 16 răng cưa để đặt 16 vòng con. Tám thanh được tụ lại bằng một ốc làm bằng một chốt nhựa. Ban đầu, người làng Chuông tự làm khuôn, pha tre tạo từng thanh một, để tạo được một khuôn nón mất rất nhiều thời gian, thu nhập không bằng khâu nón.',
          '型が笠の形を生み出します。軽やかで{美|うつく}しい笠の形は型で決まり、「良い笠は型から」と言われます。型は8本の{骨|ほね}と1本の縁の輪からなり、各骨には16の{刻|きざ}みがあって、16本の輪をはめます。8本の骨は、プラスチックの留め具でまとめられます。もともとはチュオン村の人々が自分で型を作り、竹を割って骨を一本ずつ作っていましたが、一つの型を作るには長い時間がかかり、笠を縫うほどの収入にはなりませんでした。',
        ],
        ['Khuôn nón hình chóp 16 vòng', '16本の輪の円錐形の型'],
      ],
    ],
    moldMore: [
      [
        'Trước đây, người làng Chuông tự làm khuôn nón. Tuy nhiên, từ những năm 1970 trở về đây, việc này do thợ làng Vác (làng Canh Hoạch, xã Dân Hòa) đảm nhiệm. Để làm được một chiếc khuôn nón đạt chuẩn, người thợ phải chọn tre già dài đốt, ít mắt, rồi ngâm dưới ao khoảng 3 tháng. Sau đó, người thợ cưa tre thành từng thanh nón, mỗi thanh đều được cưa khấc để đặt vành nón. Trên đầu mỗi thanh, họ khoan một lỗ tròn nhỏ để gắn ốc nón, sao cho 8 thanh ghép lại với nhau vừa khít. Thao tác ghép đòi hỏi tay nghề cao: nếu lực quá chặt sẽ làm vỡ khuôn, còn nếu quá lỏng thì khuôn bị yếu, không thể dựng được.',
        'かつてはチュオン村の人々が自分で型を作っていましたが、1970年代からはヴァック村（ザンホア社カインホアック村）の職人が{担|にな}っています。基準を満たす型を作るには、{節|ふし}と節の間が長く節の少ない古い竹を選び、池に約3か月{浸|ひた}します。その後、竹を切って骨にし、それぞれに輪をはめる刻みを入れます。骨の先には小さな丸い穴を開けて留め具を通し、8本の骨がぴったり組み合うようにします。組み立てには高い技術が必要で、きつすぎると型が{割|わ}れ、ゆるすぎると型が弱く、組み立てられません。',
      ],
      [
        'Cuối cùng, để hoàn thiện chiếc khuôn, cần thêm một sợi vòng do thợ làng Đôn Thư chế tạo, giúp liên kết các thanh tre thành một hình chóp theo đúng phom dáng của chiếc nón.',
        '最後に、ドントゥー村の職人が作る輪を加えて骨をつなぎ、笠の形どおりの円錐形にして型が完成します。',
      ],
    ],
    small: [
      [['Dao, kéo', '小刀・はさみ'], ['Dùng để xử lý, cắt tỉa lá và gọt giũa các chi tiết nguyên liệu.', '葉を切りそろえ、材料の{細部|さいぶ}を削って整えるのに使います。'], ['Dao, kéo cắt lá', '葉を切る小刀とはさみ']],
      [['Dụng cụ là lá', '葉のアイロン'], ['Giúp là phẳng phiu từng chiếc lá trước khi đưa vào khâu. Thường là lưỡi cày bằng gang cũ, phẳng, nhẵn.', '縫う前に、葉を一枚ずつ平らにのばすための道具です。古くて平らで滑らかな、{鋳鉄|ちゅうてつ}の{鋤|すき}の{刃|は}がよく使われます。'], ['Lưỡi cày gang đặt trên bếp điện', '電気コンロに載せた鋳鉄の刃']],
    ],
    outro: [
      'Để tạo ra một chiếc nón đẹp, người thợ phải tự tay lựa chọn kỹ càng từng lá, đoạn vòng và sợi cước theo những tiêu chuẩn khắt khe: lá phải có thịt trong, trắng và gân nhỏ; vòng phải tròn, nhỏ với các mấu đều phẳng; còn mo phải là loại vàng óng, kích thước vừa vặn. Và để biến những nguyên liệu thô ấy thành phẩm chất lượng, người thợ bắt đầu bước vào chuỗi các công đoạn chế tác tỉ mỉ dưới đây.',
      '美しい笠を作るために、職人は葉・輪・ナイロン糸を{厳|きび}しい{基準|きじゅん}で一つひとつ自分の手で選びます。葉は{透|す}き{通|とお}るように白く{葉脈|ようみゃく}が細いもの、輪は丸く細く節が平らなもの、モーナンは{黄金色|こがねいろ}で大きさのそろったものです。そして、これらの素材を質の高い製品に変えるため、職人は次の{細|こま}やかな製作工程へと進んでいきます。',
    ],
  },

  // ── 2.3
  process: {
    id: '2.3',
    title: ['Kỹ thuật và các công đoạn làm nón lá làng Chuông', 'チュオン村のノンラーづくりの技術と工程'],
    leaf: {
      id: '2.3.1',
      h: ['Công đoạn chuẩn bị và xử lý lá', '葉の準備と{処理|しょり}'],
      p: [
        [
          'Quy trình chuẩn bị lá nón bắt đầu từ công đoạn vò lá (chỉ áp dụng với lá lụi mua về còn tươi và nhiều nước), lá phải được vò qua cát để hút bớt độ ẩm, giúp lá khô, trắng và không bị thối. Cát dùng để vò được lấy từ giữa lòng sông Đáy, phơi khô khoảng một ngày và đãi sạch sạn sỏi bằng giản đan bằng tre trước khi đổ vào bãi vò rộng khoảng 10 mét vuông. Công việc này rất vất vả, đòi hỏi sức lực - thường do con trai đảm nhận, với thời gian vò khoảng 10 phút cho đến khi lá mềm. Sau khi vò xong, lá được đem phơi dọc bờ đê, cánh đồng hoặc sân gạch và phải đảo lá vào gần trưa để lá khô đều hai mặt. Thời gian phơi phụ thuộc vào thời tiết; mùa hè cần khoảng 2 đến 3 nắng, trong khi mùa đông cần phơi lâu hơn. Nếu gặp ngày nắng yếu hoặc mưa dầm, khi lá khô được khoảng 50 đến 60%, người thợ sẽ tiến hành sấy lá với số lượng khoảng 2.000 lá (nếu lá ướt) hoặc 2 lượt (nếu lá khô hơn) cho mỗi lần sấy. Lá sau khi khô sẽ được bó thành từng túm, mỗi túm khoảng 20 tàu.',
          '葉の準備は「葉もみ」から始まります（仕入れた葉がまだ{生|なま}で水分が多い場合のみ）。葉を砂でもんで水分を{吸|す}わせ、乾いて白く、{腐|くさ}らない葉にします。もむための砂はダイ川の川の中ほどから取り、一日ほど{干|ほ}して、竹で編んだ{箕|み}で小石を取り{除|のぞ}いてから、約10平方メートルの作業場に{敷|し}きます。力のいる{大変|たいへん}な作業で、主に男性が担当し、葉がやわらかくなるまで約10分もみます。もみ終えた葉は、堤防や田んぼ、れんが{敷|じ}きの{庭|にわ}に干し、昼前に{裏返|うらがえ}して両面を{均等|きんとう}に乾かします。干す日数は天気しだいで、夏は2〜3日、冬はそれ以上かかります。日差しが弱い日や{長雨|ながあめ}のときは、葉が50〜60％ほど乾いたところで乾燥にかけます。一回に、ぬれた葉なら約2,000枚、より乾いた葉なら2回分を乾かします。乾いた葉は約20枚ずつ{束|たば}ねます。',
        ],
        [
          'Đối với công đoạn phơi lá, lá mua về phải được phơi nắng trên nền đất với hai mép tàu lá kéo căng và có vật nặng đè xung quanh để mặt lá đón trọn ánh nắng. Sau khi phơi khô, lá được xếp thành từng bó (mỗi bó 10 tàu), ngâm nước 3 tiếng, dựng lên cho ráo nước rồi phơi tiếp hai nắng. Cuối cùng, người thợ tiến hành phơi lá vào ban đêm để lá "ăn" (ngấm) sương nhằm giúp lá mềm mại, tránh bị gãy rách khi khâu.',
          '葉を干すときは、仕入れた葉を地面に広げ、葉の両端をぴんと{張|は}って{周|まわ}りに{重|おも}しを置き、葉の面全体に日が当たるようにします。乾いた葉は10枚ずつ束ね、3時間水に浸し、立てて水を切ってから、さらに2日干します。最後に夜の{間|あいだ}に干して{夜露|よつゆ}を「{吸|す}わせる」と、葉がしなやかになり、縫うときに{折|お}れたり{破|やぶ}れたりしなくなります。',
        ],
      ],
      images: [
        ['Lá tươi được vò qua cát', '砂でもむ生の葉'],
        ['Lá lụi phơi trên triền đê', '堤防に干されたライ葉'],
      ],
    },
    stepsH: { id: '2.3.2', h: ['Quy trình dựng và hoàn thiện nón', '笠の組み立てと仕上げの工程'] },
    stripTitle: ['Quy trình chế tác', '製作の工程'],
    steps: [
      {
        no: 1,
        name: ['Rẽ lá', '{葉|は}のばし'],
        sub: ['vuốt phẳng lá', '葉を平らにする'],
        text: [
          [
            'Công đoạn rẽ lá được thực hiện do lá nón mua về vẫn còn tình trạng quăn và nhăn, cần được rẽ lại cho thật phẳng. Khi tiến hành, người thợ đặt mặt phải của cành lá hướng lên trên và thực hiện rẽ từ ngọn xuống dưới cuống. Thao tác cụ thể là dùng hai ngón cái để giữ mặt trước mép lá, trong khi tám ngón còn lại cầm ở mặt sau, vừa rẽ vừa kết hợp miết cho lá phẳng.',
            '仕入れた葉はまだ{縮|ちぢ}れていたりしわが寄っていたりするので、きれいに平らにのばす必要があります。職人は葉の表を上にして、先から根元へ向かってのばしていきます。両手の親指で葉の縁の表を押さえ、残りの8本の指で裏を持ち、のばしながらなでつけて平らにします。',
          ],
          [
            'Sau khi rẽ xong những người cẩn thận hơn sẽ tiến hành hun lá thêm một lần nữa. Để bảo quản trước khi đưa vào làm nón, lá được bọc kín nhằm tránh bị khô, đồng thời nguyên tắc làm đến đâu sẽ lấy ra đến đó.',
            'のばし終えたあと、より丁寧な職人は葉をもう一度いぶします。笠づくりに使うまでは、乾かないようにしっかり包んで{保管|ほかん}し、使う分だけ取り出すのが決まりです。',
          ],
        ],
        image: ['Tay nghệ nhân rẽ từng chiếc lá', '葉を一枚ずつのばす職人の手'],
      },
      {
        no: 2,
        name: ['Là lá', '葉のアイロンがけ'],
        sub: ['ủi phẳng lá bằng nhiệt', '熱で平らにする'],
        text: [
          [
            'Công đoạn là lá giúp lá nón phẳng phiu, mềm dẻo và giữ được màu sắc tự nhiên. Hiện nay, người thợ sử dụng bếp điện để điều chỉnh và giữ nhiệt độ ổn định thay cho cách đốt củi truyền thống.',
            'アイロンがけによって、葉は平らでしなやかになり、自然な色を保ちます。今では、{伝統的|でんとうてき}な{薪|まき}の火の{代|か}わりに、温度を調整して{一定|いってい}に保てる電気コンロを使います。',
          ],
          [
            'Một chiếc lưỡi cày bằng gang (hoặc tấm kim loại phẳng) được đặt lên bếp điện để tạo bề mặt miết lá. Trước khi làm, thợ dùng một bọc vải nhỏ xoa đều lên bề mặt kim loại để làm sạch và kiểm tra mức nhiệt. Khi tiến hành, thợ một tay giữ tệp lá đưa lên bề mặt kim loại nóng, tay kia cầm bọc vải miết lực vừa đủ và kéo đều tay cho đến khi lá phẳng mịn.',
            '鋳鉄の鋤の刃（または平らな金属板）を電気コンロに載せ、葉をのばす面にします。作業の前に、小さな布の玉で金属の表面をまんべんなくふいて{汚|よご}れを取り、温度を{確|たし}かめます。そして片手で葉の束を熱い金属に当て、もう片方の手で布の玉をほどよい力で押しつけ、葉が平らで滑らかになるまで均等に引きます。',
          ],
          [
            'Công đoạn này đòi hỏi sự khéo léo trong việc canh chỉnh nhiệt độ bếp điện: nếu nhiệt quá cao, lá (đặc biệt là lá lụi mỏng) sẽ bị đỏ và giòn; ngược lại, nếu nhiệt quá thấp, lá sẽ không đủ độ phẳng và dễ bị quăn trở lại.',
            'この工程では、電気コンロの温度を見きわめる腕が求められます。熱すぎると葉（とくに薄いライ葉）は赤く{変色|へんしょく}してもろくなり、低すぎると十分に平らにならず、すぐに縮れてしまいます。',
          ],
        ],
        image: ['Miết phẳng lá trên mặt gang nóng', '熱い鉄板で葉をのばす'],
      },
      {
        no: 3,
        name: ['Bứt vòng', '輪づくり'],
        sub: ['làm khung vành', '骨組みをつくる'],
        text: [
          [
            'Công đoạn nối và lắp các vòng nón đòi hỏi sự khéo léo để tạo ra một khung nón tròn trịa và chuẩn xác. Mặc dù các vòng nón mua về từ làng nghề đã được vót sẵn khá đẹp, người thợ vẫn cần kiểm tra lại, dùng dao gọt dũa những chỗ chưa đều và làm mỏng hai đầu để khi nối lại sẽ tạo thành một đường liền mạch, phẳng mịn. Sau đó, thợ sẽ ướm từng vòng lên khung gỗ để đánh dấu và căn chỉnh kích thước. Việc căn chỉnh này rất quan trọng: nếu làm quá chặt thì khung nón sẽ bị méo thành hình nhiều cạnh thay vì hình tròn, còn nếu lỏng quá thì khoảng cách giữa các vòng sẽ không đều nhau.',
            '輪をつないで型にはめる作業には、丸く正確な骨組みを作るための器用さが求められます。工芸村から買う輪はすでにきれいに削られていますが、職人はもう一度確かめ、{不揃|ふぞろ}いな所を小刀で削り、両端を薄くして、つないだときに{継|つ}ぎ目のない滑らかな線になるようにします。それから輪を一本ずつ木の型に当てて{印|しるし}をつけ、大きさを合わせます。この調整はとても大切で、きつすぎると骨組みは丸ではなく多角形にゆがみ、ゆるすぎると輪の間隔がそろいません。',
          ],
          [
            'Tổng cộng có 16 vòng được đưa lần lượt vào khung theo một thứ tự nhất định, từ vòng cạp lớn ở miệng nón cho đến các vòng ở thân và chóp. Mỗi loại vòng sẽ có cách xử lý riêng; ví dụ như các vòng ở thân nón thường được vuốt qua bằng miếng vải để trở nên mềm, cong và mịn hơn. Trong các bước thì phần nối vòng cạp là khó nhất vì vòng này to, cứng và rất khó uốn tròn. Những người thợ lành nghề sẽ dùng cước trắng chuyên dụng để buộc nối thật chặt, khít và mịn màng, sao cho điểm nối giáp vào nhau hoàn toàn tự nhiên. Đây được xem là một trong những kỹ thuật khéo léo nhất của nghề làm nón, thường được các thiếu niên khoảng 14 - 15 tuổi bắt đầu học và thực hành.',
            '全部で16本の輪を、口の大きな縁の輪から胴、頂の輪へと、決まった順番で型にはめていきます。輪によって処理の仕方は異なり、たとえば胴の輪は布でしごいて、やわらかく、しなやかで滑らかにします。中でも縁の輪をつなぐのがもっとも難しく、太くて硬く、丸く曲げにくいためです。熟練の職人は専用の白いナイロン糸でしっかり、すき間なく、滑らかに結び、つなぎ目がまったく自然に見えるようにします。これは笠づくりでもっとも巧みな技の一つとされ、14〜15歳ほどの若者が学び始める技でもあります。',
          ],
        ],
        image: ['Khuôn nón — nơi đặt lần lượt 16 vành nứa', '16本のヌア竹の輪を順にはめていく笠の型'],
      },
      {
        no: 4,
        name: ['Quay nón', '{葺|ふ}き{込|こ}み'],
        sub: ['lợp nón — xếp lá lên khung nón', '葉を骨組みに重ねる'],
        text: [
          [
            'Công đoạn quay nón (lợp nón) là quá trình tạo nên cấu trúc nhiều lớp cho chiếc nón, bao gồm hai lớp lá bọc ngoài và một lớp mo ở giữa.',
            '葺き込み（クアイ・ノン）は、笠の多層構造をつくる工程で、外を包む二層の葉と、間に入るモーナンの層からなります。',
          ],
          [
            'Đầu tiên, người thợ thực hiện lớp lá thứ nhất bằng cách chọn những tàu lá có phần thịt trắng trong, gân nhỏ và màu sắc đều nhau. Khoảng 17 đến 18 tàu lá được xếp chồng lên nhau, cắt phần mép, rồi cố định bằng một chiếc kim cắm ở đỉnh chóp và trải đều xung quanh khung. Tiếp theo, họ dùng dây gai chằng chéo để giữ chặt lá ở phần thân nón, đồng thời khéo léo chèn thêm các mẩu lá nhỏ vào các khoảng trống để bề mặt nón trở nên phẳng mịn.',
            'まず一層目として、透き通るように白く、葉脈が細く、色のそろった葉を選びます。17〜18枚の葉を重ねて端を切りそろえ、頂に針を刺して留め、骨組みの周りに均等に広げます。次に{麻|あさ}ひもを{斜|なな}めに{渡|わた}して胴の葉をしっかり押さえ、すき間に小さな葉を巧みに差し込んで、表面を平らで滑らかにします。',
          ],
          [
            'Sau lớp lá đầu tiên, người thợ tiếp tục lợp lớp mo ở giữa, gồm 5 tàu mo có kích thước đều nhau. Phần mo được cắt và gọt mỏng ở mép để khi xếp nối tiếp không bị cộm, với mặt phẳng mịn được quay vào trong. Lớp mo này cũng được chằng buộc bằng dây gai, sau đó sợi dây chằng của lớp lá thứ nhất sẽ được rút ra.',
            '一層目のあとは、大きさのそろった5枚のモーナンで中間の層を葺きます。モーナンは端を切って薄く削り、重ねたときに{膨|ふく}らまないようにして、滑らかな面を内側に向けます。この層も麻ひもで押さえ、そのあと一層目のひもを{抜|ぬ}き取ります。',
          ],
          [
            'Cuối cùng, lớp lá thứ hai được lợp tương tự như lớp đầu tiên, nhưng điểm khác biệt là mặt phải của lá sẽ quay ra ngoài. Khi hoàn thành lớp thứ hai, nón lại được chằng buộc cẩn thận, rút dây chằng mo ra để chuẩn bị chuyển sang công đoạn khâu.',
            '最後に、二層目の葉を一層目と同じように葺きますが、今度は葉の表を外側に向けるのが違いです。二層目ができたら、もう一度丁寧にひもで押さえ、モーナンのひもを抜いて、縫い付けの工程に{備|そな}えます。',
          ],
        ],
        image: ['Xếp từng lớp lá lụi lên khuôn', 'ライ葉を一枚ずつ型に重ねる'],
      },
      {
        no: 5,
        name: ['Khâu nón', '{縫|ぬ}い{付|つ}け'],
        sub: ['thắt nón', 'タット・ノン'],
        text: [
          [
            'Công đoạn khâu nón (thắt nón) là bước dùng kim và sợi cước để gắn chặt các lớp lá và lớp mo vào vòng nón. Quá trình này được tiến hành theo thứ tự từ trên đỉnh chóp xuống dưới vành cạp.',
            '縫い付け（タット・ノン）は、針とナイロン糸で、葉とモーナンの層を輪にしっかり縫い留める工程です。頂から縁へ向かって順に縫っていきます。',
          ],
          [
            'Khi ngồi khâu, người thợ đặt nghiêng khung nón giữa hai đầu gối để làm điểm tựa; tay trái đặt ở bên trong lòng nón còn tay phải giữ ở phía ngoài mặt nón, dùng ngón cái và ngón trỏ để cầm kim. Thao tác khâu diễn ra vô cùng nhịp nhàng, nhanh gọn và dứt khoát; tay phải đưa mũi kim đâm từ trên xuống, đồng thời tay trái ở bên dưới đón mũi kim rồi đâm ngược trở lại, vừa gạt sợi cước sang một bên vừa kéo mũi khâu thật chặt và mịn. Khi khâu nón thì kim phải đâm nghiêng, nếu đâm thẳng thì sẽ đâm vào sợi vòng, các cụ ngày xưa gọi là thắt nón. Đây là công đoạn quan trọng nhất vì nó sẽ quyết định độ chắc và đẹp của nón.',
            '縫うときは、型を両ひざの間に{斜|なな}めに置いて支えにし、左手を笠の内側に、右手を外側に置き、親指と人差し指で針を持ちます。作業はとてもリズミカルで、速く、{迷|まよ}いがありません。右手が上から針を刺すと、下の左手がそれを受けて刺し返し、ナイロン糸を{脇|わき}へよけながら、縫い目をきつく滑らかに引きしめます。針は斜めに刺さなければならず、まっすぐ刺すと輪に当たってしまいます。昔の人はこれを「タット・ノン」と呼びました。笠の丈夫さと美しさを決める、もっとも大切な工程です。',
          ],
          [
            'Nhờ sự khéo léo của người thợ, khoảng cách giữa các mũi khâu đều tăm tắp như được máy làm, các mũi kim đâm từ dưới lên khớp hoàn hảo với mũi từ trên xuống, giúp 16 vòng nón dần hiện lên duyên dáng. Thậm chí, cách giấu mối nối cước cũng khéo léo đến mức thoạt nhìn trông giống như một sợi cước dài vô tận. Sau khi khâu xong, người thợ tiến hành tháo dây chằng, nhấc nón ra khỏi khung và dùng kéo cắt bỏ phần lá thừa xung quanh, với nguyên tắc cắt càng sát vòng cạp thì vành nón trông sẽ càng đẹp.',
            '職人の巧みな手によって、縫い目の間隔は機械で縫ったようにそろい、下から刺した針目と上からの針目がぴたりと合って、16本の輪が美しく{浮|う}かび上がります。糸の継ぎ目の隠し方も巧みで、ひと目見ると終わりのない一本の長い糸のように見えるほどです。縫い終えたらひもをほどき、笠を型から外し、はさみで周りの余分な葉を切り落とします。縁の輪ぎりぎりで切るほど、つばが美しく見えます。',
          ],
        ],
        image: ['Cận cảnh mũi kim, sợi cước xuyên qua lớp lá', '葉の層を通る針と糸のクローズアップ'],
      },
      {
        no: 6,
        name: ['Nức nón', '{縁|ふち}{縫|ぬ}い'],
        sub: ['khâu viền mép nón', '縁を仕上げる'],
        text: [
          [
            'Sau khi nón đã được khâu xong và cắt bỏ phần lá thừa sát vòng cạp, người thợ tiến hành dùng cước hoặc sợi liếc chuyên dụng để khâu bọc, nức cố định kỹ phần cạp nón. Công đoạn này giúp che đi các mép cắt thô, đồng thời gia cố giúp vành nón trở nên chắc chắn, cứng cáp và giữ được form dáng chuẩn. Các mũi khâu mép đòi hỏi sự đều đặn, khít và mịn màng để tạo nên độ thẩm mỹ tinh xảo, sắc nét cho toàn bộ chiếc nón trước khi đưa ra sử dụng.',
            '縫い付けが終わり、縁の輪ぎりぎりで余分な葉を切り落としたら、ナイロン糸や専用のリエックで縁を包むように縫い、しっかり{固定|こてい}します。この工程で{粗|あら}い切り口を隠すと同時に、つばを丈夫で張りのあるものにし、正しい形を保ちます。縁の縫い目は均等で密に、滑らかでなければならず、使い始める前の笠全体に、{精巧|せいこう}でくっきりとした美しさを与えます。',
          ],
        ],
        image: ['Cắt lá thừa và khâu viền vành nón', '余分な葉を切り、縁を縫う'],
      },
      {
        no: 7,
        name: ['Luồn nhôi', 'ニョイ{通|とお}し'],
        sub: ['luồn chỉ khâu cố định lá vào vành', '色糸を通して固定する'],
        text: [
          [
            'Trong quy trình làm nón, luồn nhôi (hay làm nhôi nón) là công đoạn hoàn thiện cuối cùng rất quan trọng để gắn và cố định phần quai nón.',
            '笠づくりにおいて、ニョイ通し（ニョイづくり）は、あごひもを取り付けて固定するための、とても大切な最後の仕上げの工程です。',
          ],
          [
            'Sau khi chiếc nón đã được khâu và nức vành chắc chắn, người thợ sẽ sử dụng những sợi chỉ màu thường có 3 màu xanh, đỏ hoặc trắng để đan, luồn vào bên trong thành nón, tạo thành chiếc quai treo chắc chắn giúp người đội giữ được nón trên đầu. Công đoạn này đòi hỏi sự khéo léo để vừa đảm bảo độ bền chặt, vừa tạo nét trang trí trang nhã, làm điểm nhấn thẩm mỹ cho chiếc nón trước khi đưa sang bước quét dầu bóng bảo vệ hoàn thiện sản phẩm.',
            '笠を縫い、縁をしっかり仕上げたら、職人は青・赤・白の3色が多い色糸を笠の内側に編み込むように通し、かぶる人が笠を頭に{固定|こてい}できる丈夫なひも{掛|か}けを作ります。この工程には、丈夫さを確保しながら、上品な飾りとして笠の美しさのアクセントにもなるよう、器用さが求められます。このあと、製品を守るニスを塗る工程へと進みます。',
          ],
        ],
        image: ['Chỉ màu luồn trong lòng nón', '笠の内側に通した色糸'],
      },
    ],
    finish: {
      label: ['Xử lý hoàn thiện sản phẩm', '製品の仕上げ'],
      name: ['Quang dầu', '{油|あぶら}{塗|ぬ}り'],
      sub: ['phủ lớp dầu bóng chống thấm nước', '防水のニスを塗る'],
      text: [
        [
          'Người thợ chuẩn bị một loại dầu chuyên dụng (thường là dầu thông hoặc dầu bóng pha loãng) cùng với một chiếc chổi lông mềm, mịn để thực hiện thao tác quét.',
          '職人は専用の油（多くは松{脂|やに}油か薄めたニス）と、やわらかく{細|こま}やかな毛の{刷毛|はけ}を用意します。',
        ],
        [
          'Chiếc nón sau khi đã được nức và cắt tỉa gọn gàng, người thợ nhúng chổi vào dung dịch dầu, gạt bớt phần thừa để chổi chỉ ẩm đều, sau đó quét nhẹ nhàng và đều tay từ đỉnh chóp nón tỏa ra các hướng xuống tận vành dưới. Thao tác đòi hỏi sự tỉ mỉ, khéo léo để lớp dầu phủ lên bề mặt lá phải thật mỏng, đều và nhẵn mịn, tuyệt đối không để dầu bị vón cục, đọng vũng hay loang lổ chỗ dày chỗ mỏng.',
          '縁を仕上げ、きれいに切りそろえた笠に、刷毛を油に浸して余分を落とし、刷毛が均一に{湿|しめ}る程度にしてから、頂から縁へ放射状に、軽く均一に塗っていきます。葉の表面の油の層は薄く、均一で滑らかでなければならず、{固|かた}まりやたまり、{厚|あつ}いところと薄いところのむらは{決|けっ}して作ってはいけません。細やかさと器用さが求められる作業です。',
        ],
        [
          'Công đoạn này tạo ra một lớp màng bảo vệ trong suốt giúp nón ngăn ngừa ẩm mốc, giữ cho màu sắc của lá luôn trắng sáng đẹp theo thời gian, đồng thời làm tăng thêm độ bóng bẩy và độ bền chắc cho chiếc nón lá truyền thống. Sau khi quét xong, nón được mang ra phơi ở nơi thoáng gió, có nắng nhẹ cho đến khi lớp dầu khô hoàn toàn.',
          'この工程でできる{透明|とうめい}な{膜|まく}が、湿気やカビを防ぎ、葉の白さをいつまでも美しく保つとともに、伝統的なノンラーに艶と丈夫さを加えます。塗り終えたら、風通しがよく日差しのやわらかい場所で、油が完全に乾くまで干します。',
        ],
      ],
      image: ['Quét dầu bóng và phơi nón', '油を塗って笠を干す'],
    },
  },
}
