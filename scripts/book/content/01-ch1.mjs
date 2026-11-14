/**
 * Chương 1 — Khái quát về nón lá Việt Nam và nón lá Làng Chuông. Mỗi đoạn: [tiếng Việt, tiếng Nhật]
 * Tiếng Việt: nguyên văn tab "Chương 1" (Doc "ND + HT - Nón lá đã sửa", bản sửa lần 1).
 * Tiếng Nhật: bản dịch chính thức của nhóm (tab "JA パート1", tải 06/11/2026), chỉ sửa lỗi gõ rõ ràng
 * (danh sách: scripts/book/out/r0611/ja-p1.issues.md); phiên âm {漢字|かな} theo bản cũ.
 */
export const ch1 = {
  no: 1,
  label: ['Phần 1', 'パート1'], // 14/11: bản Nhật là bản chuẩn — パート = Phần
  title: ['Khái quát về nón lá Việt Nam\nvà nón lá Làng Chuông', 'ベトナムのノンラーと\nチュオン{村|むら}のノンラーの{概要|がいよう}'],
  lead: [
    'Nhắc đến nón lá Việt Nam, nhiều người thường hình dung ngay đến chiếc nón hình chóp quen thuộc. Tuy nhiên, nón lá không chỉ có một kiểu dáng duy nhất mà còn bao gồm nhiều loại khác nhau, mỗi loại mang những đặc điểm riêng về hình dáng, công dụng và giá trị văn hóa. Để hiểu rõ hơn về sự đa dạng ấy, Phần 1 sẽ đưa độc giả tìm hiểu những đặc điểm cơ bản của nón lá Việt Nam, các kiểu nón tiêu biểu, những dấu tích lịch sử và ý nghĩa văn hóa gắn liền với chiếc nón. Từ bức tranh tổng quan đó, phần này tiếp tục giới thiệu về nón lá làng Chuông (Hà Nội) là một đại diện tiêu biểu của nón lá truyền thống ở miền Bắc để tìm hiểu khái quát về làng nghề và các sản phẩm nón truyền thống, đặc biệt là chiếc nón lá hình chóp – đối tượng tìm hiểu trọng tâm của cuốn flipbook.',
    'ベトナムのノンラーといえば、多くの人は、なじみのある{円錐形|えんすいけい}のノンラーを思い{浮|う}かべるでしょう。しかし、ノンラーにはさまざまな{種類|しゅるい}があり、それぞれ形や{用途|ようと}、文化的{価値|かち}に{独自|どくじ}の{特徴|とくちょう}があります。こうした{多様性|たようせい}をよりよく理解できるように、パート1では、ベトナムのノンラーの基本的な特徴や代表的な種類、歴史的な{痕跡|こんせき}、ノンラーに結びついた文化的な意味について紹介します。その全体像を踏まえ、ベトナム北部の伝統的なノンラーの代表例の一つとして、ハノイ市のチュオン{村|むら}のノンラーを取り上げます。チュオン村の伝統{工芸村|こうげいむら}としての{概要|がいよう}と伝統的なノンラー製品について概説し、特に本フリップブックで主に取り上げる伝統的な円錐形のノンラーに{焦点|しょうてん}を当てます。',
  ],

  // ── 1.1
  life: {
    id: '1.1',
    title: ['Nón lá trong đời sống Việt Nam', 'ベトナムの人々の暮らしとノンラー'],
    blocks: [
      {
        h: ['Khái niệm cơ bản của nón lá', 'ノンラーの基本的な概念'],
        p: [
          [
            'Nón lá là sản phẩm thủ công truyền thống của Việt Nam, được làm từ các nguyên liệu tự nhiên như lá lụi (lá cọ non¹), tre và nứa. Trong đó, lá được sử dụng để tạo phần lợp, còn tre, nứa được gia công thành khung và các vành nón nhằm định hình sản phẩm. Tùy theo nhu cầu sử dụng, đặc điểm văn hóa và kỹ thuật chế tác của từng địa phương, nón lá có nhiều kiểu dáng và kích thước khác nhau, góp phần tạo nên sự đa dạng của nghề làm nón truyền thống Việt Nam.',
            'ノンラー（ベトナム発祥の、{葉|は}で作られた伝統的なノンラーの一種）は、ラルイ（{若|わか}いヤシの葉¹）や竹、ヌア（ベトナムの竹の{一種|いっしゅ}）などの{天然|てんねん}{素材|そざい}を使って作られるベトナムの伝統工芸品です。葉はノンラーの表面を覆う部分に使われ、竹やヌアは{骨組|ほねぐ}みや輪状の部材に加工され、ノンラーの形を整える役割を果たします。ノンラーには、使用目的や地域ごとの文化的{特徴|とくちょう}、{製作技術|せいさくぎじゅつ}に応じて、さまざまな形や大きさがあります。こうした違いが、ベトナムの伝統的なノンラー作りの{多様性|たようせい}につながっています。',
          ],
        ],
        // Bổ sung 2 (12/11): 'Footnote “ヤシ：…” chuyển lên phần 1.1'; 14/11 (bản Nhật là bản chuẩn): bản Việt cũng chuyển chú thích "Cây cọ" lên đây
        notes: [['¹ Cây cọ: cây cao, thuộc họ dừa, lá hình quạt, mọc thành chùm ở ngọn, thường dùng để lợp nhà, làm nón, v.v.', '¹ ヤシ：ヤシ科の背の高い植物で、扇形の{葉|は}が{幹|みき}の先端にまとまって生えています。葉は屋根を{葺|ふ}いたり、ノンラーを作ったりする際などに使われます。']],
        // 08/11: ảnh nhóm gắn trong bản Nhật (1-02), chú thích JA nguyên văn nhóm
        images: [['Nón lá — nguồn: nghệ nhân Tạ Thu Hương', 'ノンラー — 出典：職人タ・トゥ・フオン氏']],
      },
      {
        h: ['Công dụng của nón lá', 'ノンラーの{用途|ようと}'],
        p: [
          [
            'Trong đời sống thường ngày, nón lá được sử dụng chủ yếu để che nắng, che mưa, đặc biệt khi lao động và di chuyển ngoài trời. Ngoài công dụng đội đầu, nón lá còn có thể được tận dụng để quạt mát hoặc đựng tạm rau củ, bánh trái khi đi chợ, tùy theo hình dáng và kích thước của từng loại. Những công dụng này đã khiến chiếc nón trở thành vật dụng quen thuộc trong sinh hoạt của người Việt.',
            '日常生活では、ノンラーは主に日差しや雨を防ぐために使われ、特に{屋外|おくがい}での作業や移動の際に役立ちます。また、頭にかぶるだけでなく、形や大きさによっては、あおいで涼をとったり、市場での買い{物|もの}の際に野菜や果物、{菓子|かし}などを一時的に入れたりすることもできます。こうした{用途|ようと}から、ノンラーはベトナムの人々の日常生活において身近な生活用品となっています。',
          ],
        ],
        // 08/11: ảnh 1-03 (đã có; nguồn theo nhóm: Bảo tàng Hà Nội) + 1-04 (mới)
        images: [
          ['Nón lá trong đời sống thường ngày: che nắng, che mưa khi lao động', '屋外での作業に使われるノンラー'],
          ['Người dân đội nón lá đi chợ — nguồn: Bảo tàng Hà Nội', 'ノンラーをかぶって市場へ行く人々 — 出典：ハノイ博物館'],
        ],
      },
      {
        h: ['Giá trị văn hóa và thẩm mỹ của nón lá', 'ノンラーの文化的・{美的|びてき}{価値|かち}'],
        p: [
          [
            'Bên cạnh công dụng trong sinh hoạt, nón lá còn mang giá trị văn hóa gắn liền với hình ảnh con người Việt Nam qua nhiều thế hệ. Chiếc nón thường xuất hiện cùng áo dài và các trang phục truyền thống, đặc biệt trong những hình ảnh về người phụ nữ Việt Nam. Sự kết hợp này góp phần tạo nên vẻ đẹp giản dị, duyên dáng, trở thành hình ảnh quen thuộc khi giới thiệu về văn hóa Việt Nam.',
            'ノンラーは、日常生活で使われる道具であるだけでなく、世代を超えてベトナムの人々の姿と結びついてきた文化的{価値|かち}もあります。ノンラーはアオザイをはじめとする{伝統衣装|でんとういしょう}とともに登場することが多く、特にベトナムの女性を描いた場面でよく見られます。こうした組み合わせは、{素朴|そぼく}で優美な印象を生み出し、ベトナムの文化を紹介する際にもなじみ深いイメージとなっています。',
          ],
          [
            'Giá trị văn hóa của nón lá còn được thể hiện qua việc lưu giữ và trưng bày tại các bảo tàng. Tại đây, những chiếc nón được giới thiệu như một phần của đời sống và văn hóa truyền thống, giúp khách tham quan tìm hiểu về đặc điểm cũng như vai trò của nón lá trong sinh hoạt của người Việt.',
            'ノンラーの文化的{価値|かち}は、博物館での収蔵や{展示|てんじ}にも表れています。博物館では、ノンラーが伝統的な暮らしや文化の一部として紹介されており、来館者はその{特徴|とくちょう}や、ベトナムの人々の生活において果たしてきた役割について知ることができます。',
          ],
          [
            'Ngoài ra, hình dáng nón lá còn trở thành nguồn cảm hứng trong các lĩnh vực sáng tạo như nghệ thuật, thời trang và kiến trúc. Một ví dụ tiêu biểu là Nhà hát Cao Văn Lầu¹, với thiết kế ba khối mái lấy cảm hứng từ hình dáng chiếc nón lá truyền thống. Công trình thể hiện việc vận dụng hình ảnh nón lá trong kiến trúc hiện đại, đồng thời gợi nhắc đến nét đặc trưng của văn hóa Việt Nam.',
            'また、ノンラーの形は、芸術やファッション、建築などの創作分野でも{着想|ちゃくそう}の{源|みなもと}となっています。その代表的な例が、伝統的なノンラーの形をモチーフにした三つの屋根部分が{特徴|とくちょう}のカオ・ヴァン・ラウ{劇場|げきじょう}です¹。この建築物は、ノンラーの形を現代建築に取り入れたものであり、ベトナム文化の特徴を思い起こさせるものでもあります。',
          ],
          [
            'Như vậy, nón lá không chỉ là vật dụng trong sinh hoạt mà còn mang những giá trị văn hóa và thẩm mỹ, tiếp tục được gìn giữ và thể hiện dưới nhiều hình thức trong đời sống hiện đại.',
            'このように、ノンラーは生活用品であるだけでなく、文化的・{美的|びてき}{価値|かち}も持っています。その価値は現代の生活の中でも、さまざまな形で{受|う}け継がれ、表現されています。',
          ],
        ],
        notes: [['¹ Còn gọi là Nhà hát Ba Nón Lá, công trình kiến trúc văn hóa tiêu biểu tại tỉnh Bạc Liêu.', '¹「三つのノンラー{劇場|げきじょう}」とも呼ばれ、バクリエウ{省|しょう}を代表する文化的な建築物です。']],
        // 08/11 (Zalo: "Gen lại ảnh theo thẻ tiếng Nhật"): đúng ảnh nhóm gắn, đặt sau từng đoạn như bản Nhật —
        // đoạn áo dài: 1-14, 1-15 · đoạn bảo tàng: 1-16, 1-17, 1-18 · đoạn Cao Văn Lầu: 1-19 · thời trang: 1-20, 1-21
        images: {
          aoDai: [
            ['Thiếu nữ trong tà áo dài bên những chiếc nón lá', 'アオザイをまとったベトナム人女性とノンラー'],
            ['Những người phụ nữ trong tà áo dài cùng nón lá', 'アオザイをまとったベトナム人女性とノンラー'],
          ],
          museum: [
            ['Tủ trưng bày các kiểu nón lá trong bảo tàng', '博物館に{展示|てんじ}されているノンラー'],
            ['Nón lá trưng bày cùng con rối và đồ thủ công trong bảo tàng', '博物館に{展示|てんじ}されているノンラー'],
            ['Nón lá trưng bày tại Bảo tàng Phụ nữ Việt Nam', '博物館に{展示|てんじ}されているノンラー'],
          ],
          theater: ['Nhà hát Ba Nón Lá Cao Văn Lầu, Bạc Liêu — nguồn: Báo Thanh Niên', 'バクリエウ{省|しょう}にあるカオ・ヴァン・ラウ三つのノンラー{劇場|げきじょう} — 出典：Báo Thanh Niên'],
          fashion: [
            ['Nón lá trong thiết kế trang phục — nguồn: VietNamNet', '衣装デザインに取り入れられたノンラー — 出典：VietNamNet'],
            ['Nón lá trên sàn diễn thời trang — nguồn: Báo Sóng Trẻ', '衣装デザインに取り入れられたノンラー — 出典：Báo Sóng Trẻ'],
          ],
        },
      },
    ],
  },

  // ── hình dáng nón lá phổ biến (thuộc 1.1, đứng giữa "Công dụng" và "Giá trị văn hóa và thẩm mỹ")
  shapes: {
    title: ['Hình dáng nón lá phổ biến', 'ノンラーの代表的な形'],
    intro: [
      'Nón lá Việt Nam có nhiều kiểu dáng, gắn với nhu cầu sử dụng và đặc điểm văn hóa của từng vùng miền. Xét về hình dáng, có thể giới thiệu một số loại nón tiêu biểu thông qua hai nhóm: nón hình chóp và nón tròn vành rộng. Cách phân nhóm này nhằm giúp người đọc dễ hình dung sự khác biệt về kiểu dáng, không phải hệ thống phân loại bao quát toàn bộ các loại nón truyền thống Việt Nam.',
      'ベトナムのノンラーには、地域ごとの使用目的や文化的{特徴|とくちょう}に応じて、さまざまな形があります。形の違いに着目すると、代表的なノンラーを「{円錐形|えんすいけい}」と「つばの広い{円形|えんけい}」の二つのグループに分けて紹介することができます。この分け{方|かた}は、読者が形の違いを理解しやすくするためのものであり、ベトナムの伝統的なノンラーをすべて{網羅|もうら}する{分類|ぶんるい}体系ではありません。',
    ],
    groups: [
      {
        name: ['Nón lá hình chóp', '{円錐形|えんすいけい}のノンラー'],
        text: [
          'Nón lá hình chóp thường có phần đỉnh nhọn, thân nón mở rộng dần xuống vành, tạo nên dáng vẻ thanh thoát, cân đối. Một số loại nón tiêu biểu thuộc nhóm này có thể kể đến như:',
          '{円錐形|えんすいけい}のノンラーは、一般的に先端が尖っており、上部から{縁|ふち}に向かって徐々に広がる、すっきりとしたバランスのよい形が{特徴|とくちょう}です。このグループの代表的なノンラーには、次のようなものがあります。',
        ],
        items: [
          [['Nón bài thơ', 'ノン・バイ・トー'], ['Thành phố Huế', 'フエ市']],
          [['Nón lá sen', 'ノン・ラー・セン'], ['Thành phố Huế', 'フエ市']],
          [['Nón lá bàng', 'ノン・ラー・バン'], ['Thành phố Huế', 'フエ市']],
          [['Nón ngựa', 'ノン・グア'], ['Tỉnh Gia Lai (Bình Định cũ)', 'ザライ{省|しょう}（旧ビンディン省）']],
          [['Nón lá làng Chuông', 'チュオン{村|むら}のノンラー'], ['Hà Nội', 'ハノイ市']],
          // 06/11: nhóm thêm trong bản Nhật (ảnh 1-10): タイ族のノンラー ― タイグエン省 (Báo Dân tộc và Phát triển)
          [['Nón người Tày', 'タイ族のノンラー'], ['Thái Nguyên', 'タイグエン{省|しょう}']],
        ],
      },
      {
        name: ['Nón lá hình tròn vành rộng', 'つばの広い{円形|えんけい}のノンラー'],
        text: [
          'Nhóm nón lá hình tròn vành rộng có đường kính lớn, phần thân nón tương đối nông và dáng nón xòe rộng tạo nên hình dáng khác biệt so với nón hình chóp. Những hình ảnh tiêu biểu gắn với kiểu dáng này có thể kể đến như:',
          'つばの広い{円形|えんけい}のノンラーは、直径が大きく、{笠|かさ}の深さが{比較的|ひかくてき}浅いことが{特徴|とくちょう}です。全体が大きく広がった形をしており、{円錐形|えんすいけい}のノンラーとは{異|こと}なる形が特徴です。このグループの代表的なノンラーには、次のようなものがあります。',
        ],
        items: [
          [['Nón ba tầm', 'ノン・バータム'], ['Hà Nội', 'ハノイ市']],
          [['Nón quai thao', 'ノン・クアイ・タオ'], ['Hà Nội', 'ハノイ市']],
          [['Nón thúng', 'ノン・トゥン'], ['Nghệ An', 'ゲアン{省|しょう}']],
        ],
      },
    ],
    outro: [
      'Sự đa dạng về hình dáng và kỹ thuật chế tác đã tạo nên những nét riêng cho các loại nón, đồng thời phản ánh sự phong phú của nghề làm nón truyền thống Việt Nam.',
      'このように、ノンラーには形や{製作技術|せいさくぎじゅつ}にさまざまな違いがあり、それぞれに{独自|どくじ}の{特徴|とくちょう}が見られます。こうした{多様性|たようせい}は、ベトナムの伝統的なノンラー作りの{豊|ゆた}かさを示しています。',
    ],
  },

  // ── 1.2
  history: {
    id: '1.2',
    title: ['Nón lá trong dòng chảy lịch sử', '歴史の中のノンラー'],
    traces: {
      h: ['Dấu tích của nón lá', 'ノンラーに関する歴史的な{痕跡|こんせき}'],
      p: [
        [
          'Theo tài liệu Nghề đẹp quê hương (Nguyễn Vỵ), những hình ảnh được cho là tiền thân của chiếc nón đã xuất hiện trên trống đồng Ngọc Lũ và thạp đồng Đào Thịnh, có niên đại khoảng 2500–3000 năm trước theo tư liệu này¹. Những hình chạm khắc gợi liên tưởng đến vật đội đầu mà cư dân Việt cổ có thể đã sử dụng, với chất liệu được phỏng đoán là lông chim kết lại hoặc các loại lá cây bản rộng, dày như lá cọ. Tuy nhiên, những hình ảnh này chưa đủ cơ sở để xác định chính xác hình dáng và chất liệu của chiếc nón thời kỳ đó. Vì vậy, đây được xem là những tư liệu tham khảo góp phần tìm hiểu về các hình thức vật đội đầu trong đời sống cư dân Việt cổ, thay vì bằng chứng trực tiếp về chiếc nón lá hiện nay.',
          'グエン・ヴィの著書『Nghề đẹp quê hương』によると、ノンラーの{原型|げんけい}と考えられる図像が、約2,500～3,000年前のものとされるゴックルーの{銅鼓|どうこ}やダオティンの青銅製容器に見られます¹。これらの彫刻からは、古代ベトナムの人々が使用していた可能性のあるかぶり{物|もの}がうかがえます。その{素材|そざい}については、鳥の{羽|はね}を{束|たば}ねたものや、ヤシの{葉|は}のような幅が広く厚みのある葉が使われていたと{推測|すいそく}されています。しかし、これらの図像だけでは、当時のかぶり物の形や素材を正確に{特定|とくてい}することはできません。そのため、現在のノンラーの存在を{直接|ちょくせつ}示す{証拠|しょうこ}というよりも、古代ベトナムの人々が使用していたかぶり物の形態を知るための参考資料として位置づけられています。',
        ],
        [
          'Bên cạnh các dấu tích khảo cổ về nón lá thì còn có nghề làm nón được đề cập trong những tài liệu về nghề thủ công truyền thống. Theo tư liệu Từ điển văn hóa cổ truyền Việt Nam do Hữu Ngọc (chủ biên), nghề này muộn nhất đã có từ thời Trần, khoảng thế kỷ XIII–XIV². Trong xã hội xưa, nón có nhiều loại dành cho những đối tượng và mục đích sử dụng khác nhau, chẳng hạn nón tam giang dành cho người lớn tuổi, nón chéo vành dành cho binh lính hay nón tu lờ dành cho nhà sư,... Điều này cho thấy các loại nón đã được sử dụng trong nhiều hoàn cảnh khác nhau của đời sống truyền thống.',
          'こうした{考古|こうこ}学的な{痕跡|こんせき}に加え、伝統工芸に関する文献にも、ノンラー作りについての記述が見られます。フー・ゴック{編|へん}『Từ điển văn hóa cổ truyền Việt Nam』によると、ノンラー作りは、{遅|おそ}くとも13～14世紀のチャン朝時代にはすでに存在していたとされています²。かつての社会では、使用する人や目的に応じてさまざまな{種類|しゅるい}のノンラーがありました。例えば、年配の人がかぶるノン・タムザン、兵士が使用するノン・チェオヴァイン、{僧侶|そうりょ}がかぶるノン・トゥーローなどが挙げられます。このことから、さまざまな種類のノンラーが、かつての人々の暮らしのさまざまな場面で使用されていたことがわかります。',
        ],
      ],
      notes: [
        ['¹ Nghề đẹp quê hương, Ty Văn hóa Thông tin Hà Sơn Bình, 1977, tr. 141.', '¹『Nghề đẹp quê hương』、ハソンビン省文化情報局、1977年、141頁。'],
        ['² Hữu Ngọc (chủ biên), Từ điển văn hóa cổ truyền Việt Nam, NXB Kim Đồng, tr. 521.', '² フー・ゴック（{編|へん}）『Từ điển văn hóa cổ truyền Việt Nam』、キムドン出版社、521頁。'],
      ],
    },
    blocks: [
      {
        h: ['Sự thay đổi nhận thức về hình dáng nón trong thời hiện đại', '現代におけるノンラーの形状に対する認識の{変化|へんか}'],
        p: [
          [
            'Trải qua thời gian, hình dáng của nón lá Việt Nam có những thay đổi để phù hợp với nhu cầu sử dụng, điều kiện sinh hoạt và thị hiếu thẩm mỹ của từng thời kỳ. Bên cạnh những kiểu nón có vành rộng, thân tương đối nông được sử dụng trong xã hội xưa, nón lá hình chóp dần trở nên phổ biến và được nhận diện rộng rãi trong đời sống hiện đại.',
            '時代とともに、ベトナムのノンラーの形は、時代ごとの{用途|ようと}や生活環境、{美的|びてき}感覚に応じて{変化|へんか}してきました。かつては、つばが広く、深さが{比較的|ひかくてき}浅い形のノンラーも使われていましたが、次第に{円錐形|えんすいけい}のノンラーが広く{普及|ふきゅう}し、現代の人々の暮らしの中でよく知られるようになりました。',
          ],
          [
            'Ngày nay, nón lá hình chóp đã trở thành kiểu dáng quen thuộc khi nhắc đến nón lá Việt Nam. Tuy nhiên, những kiểu nón truyền thống khác vẫn được lưu giữ, phục dựng hoặc tiếp tục sử dụng trong các hoạt động văn hóa tại một số địa phương. Điều này cho thấy sự đa dạng về hình dáng của nón lá vẫn được duy trì, dù mức độ phổ biến và mục đích sử dụng của từng loại đã có những thay đổi theo thời gian.',
            '今日では、ベトナムのノンラーといえば、{円錐形|えんすいけい}のノンラーが広く思い{浮|う}かべられるようになっています。一方、ほかの伝統的な形のノンラーも、一部の地域では現在も{保存|ほぞん}・{復元|ふくげん}されたり、文化活動で引き続き使用されたりしています。このように、時代とともにノンラーの{普及|ふきゅう}の状況や使われ{方|かた}は{変化|へんか}してきましたが、さまざまな伝統的な形が今も{受|う}け継がれています。',
          ],
        ],
        // 08/11: ảnh 1-24 (nhóm gắn; ảnh kho của nhiếp ảnh Trọng Khải — nguồn theo ảnh gốc, xem trang Nguồn ảnh)
        images: [['Người bán nón lá ở chợ Chuông', 'ノンラーを売る人']],
      },
      {
        h: ['Nón lá trong hoạt động giới thiệu và quảng bá văn hóa Việt Nam', 'ベトナム文化の紹介・{普及|ふきゅう}におけるノンラー'],
        p: [
          [
            'Ngày nay, nón lá còn xuất hiện trong nhiều hoạt động giao lưu và quảng bá văn hóa Việt Nam. Hình ảnh chiếc nón được sử dụng trong các chương trình biểu diễn nghệ thuật, sự kiện văn hóa và hoạt động quảng bá du lịch. Bên cạnh đó, nón lá còn được lựa chọn làm sản phẩm thủ công và quà lưu niệm dành cho du khách, bạn bè quốc tế.',
            '現在、ノンラーはベトナム文化の{交流|こうりゅう}や発信を目的としたさまざまな活動にも登場しています。ノンラーは、芸術公演や文化イベント、観光プロモーションなどでも用いられています。また、観光客や海外の人々向けの工芸品や{土産|みやげ}物としても選ばれています。',
          ],
          [
            'Trong các hoạt động giao lưu văn hóa ở nước ngoài, nón lá thường xuất hiện cùng áo dài và những sản phẩm thủ công truyền thống khác. Sự hiện diện này góp phần giới thiệu những nét đặc trưng của văn hóa Việt Nam đến với công chúng quốc tế, đồng thời cho thấy nón lá là một trong những hình ảnh mang tính biểu trưng của văn hóa Việt Nam.',
            '海外で行われる文化{交流|こうりゅう}活動では、ノンラーはアオザイやほかの伝統工芸品とともに紹介されることがよくあります。こうした場面でノンラーが用いられることは、ベトナム文化の{特徴|とくちょう}を海外の人々に伝える一助となっています。同時に、ノンラーがベトナム文化を{象徴|しょうちょう}するものの一つであることも示しています。',
          ],
        ],
        images: [
          // ảnh 1-25 (06/11, ảnh nhóm gắn): chú thích JA nguyên văn nhóm
          ['Giới thiệu văn hóa Việt Nam tại Triển lãm Thế giới Expo 2021 Dubai', 'ドバイ国際博覧会2021におけるベトナム文化の紹介'],
          // ảnh 1-26 (a)
          ['Phu nhân Thủ tướng Singapore và Phu nhân Thủ tướng Việt Nam đội nón lá (3/2025) — nguồn: VietNamNet', 'ノンラーをかぶるシンガポール首相夫人 — 出典：VietNamNet'],
          // ảnh 1-27: 08/11 đổi sang đúng ảnh nhóm gắn (Báo Thanh Niên)
          ['Tổng thống Hàn Quốc đội nón lá — nguồn: Báo Thanh Niên', 'ノンラーをかぶる韓国大統領 — 出典：Báo Thanh Niên'],
        ],
      },
      {
        h: ['Từ nón lá nói chung đến nón lá làng Chuông nói riêng', 'ベトナムのノンラーからチュオン{村|むら}のノンラーへ'],
        p: [
          [
            'Bên cạnh việc hiện diện trong đời sống và các hoạt động văn hóa, nón lá còn gắn liền với những làng nghề thủ công truyền thống tại nhiều địa phương. Chính tại các làng nghề này, kinh nghiệm và kỹ thuật làm nón được lưu truyền qua nhiều thế hệ, góp phần duy trì những giá trị của nghề thủ công truyền thống.',
            'ノンラーは、人々の暮らしや文化活動の中で使われているだけでなく、ベトナム各地の伝統{工芸村|こうげいむら}とも深く結びついています。こうした村々では、ノンラー作りの経験や技術が何世代にもわたって{受|う}け継がれ、伝統工芸の{価値|かち}を維持することにつながっています。',
          ],
          [
            'Trong số đó, làng Chuông (Hà Nội) là một trong những làng nghề làm nón tiêu biểu ở miền Bắc. Tại đây, người thợ sử dụng những nguyên liệu quen thuộc cùng kỹ thuật chế tác thủ công để tạo nên nhiều sản phẩm nón mang nét đặc trưng riêng của làng.',
            'その中でも、ハノイ市のチュオン{村|むら}は、ベトナム北部の代表的なノンラー作りの伝統{工芸村|こうげいむら}の一つです。この村では、職人たちがなじみのある{材料|ざいりょう}と手作業による{製作技術|せいさくぎじゅつ}を用いて、村{独自|どくじ}の{特徴|とくちょう}を持つさまざまなノンラーを作っています。',
          ],
          [
            'Phần tiếp theo sẽ giới thiệu khái quát về làng Chuông và các sản phẩm nón truyền thống của làng, trong đó tập trung vào chiếc nón lá hình chóp – đối tượng tìm hiểu chính của cuốn flipbook.',
            '続いて、チュオン{村|むら}の{概要|がいよう}と村の伝統的なノンラー製品について紹介します。特に、このフリップブックで主に取り上げる伝統的な{円錐形|えんすいけい}のノンラーに{焦点|しょうてん}を当てます。',
          ],
        ],
        // 08/11: ảnh 1-28 (nhóm gắn)
        images: [['Nón lá làng Chuông với nhiều kiểu dáng, mẫu mã — nguồn: Tạp chí điện tử Văn hóa và Phát triển', 'さまざまな形やデザインのチュオン{村|むら}のノンラー — 出典：Tạp chí điện tử Văn hóa và Phát triển']],
      },
    ],
  },

  // ── 1.3
  village: {
    id: '1.3',
    title: ['Nón lá Làng Chuông', 'チュオン{村|むら}のノンラー'],
    about: {
      id: '1.3.1',
      h: ['Khái quát về Làng Chuông', 'チュオン{村|むら}の{概要|がいよう}'],
      p: [
        [
          'Làng Chuông nằm tại xã Thanh Oai (trước đây là xã Phương Trung, huyện Thanh Oai), thành phố Hà Nội, cách trung tâm Thủ đô khoảng 30 km về phía Tây Nam. Đây là làng nghề nổi tiếng với truyền thống làm nón lá từ hơn 300 năm trước. Nghề làm nón đã được duy trì qua nhiều thế hệ, trở thành hoạt động gắn liền với đời sống kinh tế, sinh hoạt và văn hóa của người dân địa phương.',
          // địa chỉ theo bản Nhật của nhóm (xã Phương Trung, ~30 km về phía Tây); chữ Việt giữ — xem ja-p1.issues.md
          'チュオン{村|むら}はハノイ市フオンチュン社に位置し、ハノイ中心部から西へ約30kmの距離にあります。300年以上にわたるノンラー作りの伝統で知られる{工芸村|こうげいむら}です。ノンラー作りは代々受け継がれ、地域の人々の経済活動や日常生活、文化と深く結びついています。',
        ],
        [
          'Trong lịch sử, theo cuốn Hỏi đáp về làng nghề truyền thống Việt Nam (Hoàng Đức Nhuận và cộng sự, 2009), nón lá Làng Chuông không chỉ được sử dụng rộng rãi trong đời sống hằng ngày mà còn từng được lựa chọn làm cống vật tiến dâng lên Hoàng hậu, Công chúa¹. Đến thời kỳ kháng chiến chống Mỹ, người dân trong làng tiếp tục duy trì sản xuất để đáp ứng nhu cầu sinh hoạt và hỗ trợ lực lượng thanh niên xung phong. Một số loại nón còn được khâu thêm lớp vải dù ngụy trang để sử dụng trên các tuyến đường ra mặt trận. Điều này không chỉ phản ánh nét đẹp trong sản xuất truyền thống mà còn khẳng định những đóng góp quan trọng của làng nghề qua từng mốc lịch sử gian lao của dân tộc (Vũ Từ Trang & Oger, 2020)².',
          '『Hỏi đáp về làng nghề truyền thống Việt Nam』（Hoàng Đức Nhuậnほか、2009年）によると、チュオン{村|むら}のノンラーは、かつて日常生活で広く使われていただけでなく、{皇后|こうごう}や{王女|おうじょ}に献上する貢ぎ{物|もの}にも選ばれていました¹。{抗米戦争|こうべいせんそう}期にも、村の人々は生活上の{需要|じゅよう}に{応|こた}え、青年{突撃隊|とつげきたい}を支援するために、ノンラーの生産を続けました。一部のノンラーには、{前線|ぜんせん}へと続く道で使用するため、迷彩用のパラシュート生地が{縫|ぬ}い{付|つ}けられていました。こうした営みは、伝統的なものづくりの美しさを表すだけでなく、民族が{苦難|くなん}を経験した歴史の各時期に、この{工芸村|こうげいむら}が果たしてきた重要な{貢献|こうけん}を明確に示しています（Vũ Từ Trang & Oger、2020年）²。',
        ],
        [
          'Ngày nay, nghề làm nón Làng Chuông vẫn tiếp tục được gìn giữ chủ yếu theo mô hình sản xuất hộ gia đình. Từ khâu chuẩn bị nguyên liệu, làm khung, chằm nón cho đến hoàn thiện sản phẩm đều diễn ra trong không gian sinh hoạt quen thuộc của mỗi nếp nhà. Tùy theo độ khéo léo và kinh nghiệm, mỗi thành viên trong gia đình sẽ đảm nhận từng công đoạn riêng biệt. Chính phương thức sản xuất mộc mạc ấy không chỉ bảo tồn trọn vẹn những kỹ thuật thủ công tinh xảo, mà còn là sợi dây kết nối, truyền lửa nghề qua nhiều thế hệ.',
          '現在も、チュオン{村|むら}のノンラー作りは、主に家族単位の生産形態で{受|う}け継がれています。{材料|ざいりょう}の{準備|じゅんび}から{骨組|ほねぐ}み作り、{縫|ぬ}い{付|つ}け、{仕上|しあ}げに至るまで、すべての工程は、それぞれの家庭の{慣|な}れ親しんだ生活空間で行われています。家族の一人ひとりが、手先の{器用|きよう}さや経験に応じて、それぞれの工程を{担当|たんとう}しています。こうした{素朴|そぼく}な生産のあり{方|かた}は、精緻な手仕事の技術を余すところなく守り伝えるだけでなく、世代をつなぎ、ノンラー作りへの情熱を次の世代へと受け継ぐ役割も果たしています。',
        ],
      ],
      notes: [
        ['¹ Hỏi đáp về làng nghề truyền thống Việt Nam, NXB Quân đội nhân dân, 2009, tr. 50.', '¹『Hỏi đáp về làng nghề truyền thống Việt Nam』、人民軍出版社、2009年、50頁。'],
        ['² Vũ Từ Trang, Henri Oger, Nghề cổ nước Việt – Từ truyền thống đến hiện đại, NXB Phụ nữ Việt Nam, 2020, tr. 218.', '² Vũ Từ Trang, Henri Oger『Nghề cổ nước Việt – Từ truyền thống đến hiện đại』、ベトナム女性出版社、2020年、218頁。'],
      ],
      images: [
        ['Bản đồ hành trình từ trung tâm Hà Nội tới Làng Chuông (xã Thanh Oai, Hà Nội) — nguồn: nền bản đồ © OpenStreetMap', 'ハノイ中心部からチュオン村（ハノイ市タインオアイ社）への道のり — 出典：地図データ © OpenStreetMap'],
        ['Hàng bán nón ở Hà Nội năm 1896 — ảnh: André Salles (Thư viện Quốc gia Pháp)', '1896年、ハノイのノンラー屋 — 写真：アンドレ・サル（フランス国立図書館）'],
      ],
      // 08/11: ảnh 1-30 (nhóm gắn sau đoạn tiến cống / kháng chiến): ông Tuy làm nón
      tuy: ['Nghệ nhân Lê Văn Tuy làm nón tại cơ sở của ông — nguồn: nghệ nhân Lê Văn Tuy', 'ノンラーを作る職人のレ・ヴァン・トゥイ氏 — 出典：職人レ・ヴァン・トゥイ氏'],
      // 1-31 (nhóm gắn sau ảnh ông Tuy): チュオン村のディン（村の共同祭祀施設） (グループ撮影)
      dinh: ['Cổng đình làng Chuông', 'チュオン村のディン（村の共同祭祀施設）'],
      // góp ý 04/11 (Thu Nguyệt): ảnh trong mục phải là nón Làng Chuông / nón cổ chụp tại bảo tàng theo đúng ảnh nhóm chọn
      museum: [
        // ảnh 1-29 (a): chú thích Nhật theo nhóm
        ['Nón lá làng Chuông tại quầy trưng bày của Bảo tàng Dân tộc học Việt Nam', 'ベトナム民族学博物館の{展示|てんじ}コーナーにあるチュオン{村|むら}の女性の模型'],
        ['Nón Ba tầm — Bảo tàng Mỹ thuật Việt Nam', 'ノン・バータム — ベトナム美術博物館'],
        ['Nón của dân tộc Kinh: tre, lá dưa, lồng chim, bạc — Bảo tàng Mỹ thuật Việt Nam', 'キン族のノンラー：竹・葉・鳥の羽・銀 — ベトナム美術博物館'],
      ],
    },
    types: {
      id: '1.3.2',
      h: ['Nón lá Làng Chuông', 'チュオン{村|むら}のノンラー'],
      intro: [
        'Nghề làm nón Làng Chuông đã được duy trì qua nhiều thế hệ, gắn liền với đời sống sinh hoạt và hoạt động sản xuất của người dân địa phương. Theo thời gian, cùng với sự phát triển của đời sống hiện đại và nhu cầu thị trường thay đổi, các sản phẩm nón của Làng Chuông đã linh hoạt chuyển mình về kiểu dáng, chất liệu và công dụng. Bên cạnh việc duy trì sản xuất nón lá chóp truyền thống, các nghệ nhân nơi đây đã sáng tạo thêm nhiều dòng sản phẩm mới, kết hợp tinh tế giữa kỹ thuật thủ công lâu đời và chất liệu hiện đại:',
        'チュオン{村|むら}のノンラー作りは、地域の人々の日常生活や生産活動と深く結びつきながら、代々受け継がれてきました。現代の暮らしの発展や市場のニーズの{変化|へんか}に伴い、村のノンラーも形や{素材|そざい}、{用途|ようと}の{面|めん}で{柔軟|じゅうなん}に変化してきました。職人たちは、伝統的な{円錐形|えんすいけい}のノンラーの生産を続ける一方で、長年受け継がれてきた手仕事の技術と現代の素材を巧みに組み合わせ、次のような新たな製品も生み出しています。',
      ],
      // tab "Bổ sung 2" (GVHD, 11/11): "Thêm đoạn ngắn nội dung trước khi đi vào các nón: ( Bố cục đã ổn, chỉ cần đổi vị trí các
      // loại nón); không đánh stt các nón, chỉ cần kể tên là được. Thay số bằng một chiếc nón nhỏ ở đầu trang." — đoạn Việt
      // nguyên văn của nhóm; bản Nhật theo bản dịch nhóm gửi ở tab Bổ sung 2 (12/11)
      shape: [
        'Xét theo hình dáng, nón Làng Chuông được chia thành hai nhóm chính: nón chóp nhọn và nón vành rộng. Nón chóp có kiểu dáng chóp nhọn với độ cao vừa phải, thu nhỏ dần một cách mềm mại từ vành nón lên đến đỉnh. Trong khi đó, nón vành rộng có phần vành lớn, dáng nón thấp và trải rộng hơn. Hai nhóm này thể hiện sự đa dạng về kiểu dáng trong nghề làm nón truyền thống Làng Chuông.',
        // Bổ sung 2 (12/11): bản dịch của nhóm (nguyên văn)
        '形状から見ると、チュオン{村|むら}のノンラーは、先端が尖った{円錐形|えんすいけい}のノンラーと、つばの広いノンラーの二つに大きく分けられます。円錐形のノンラーはほどよい高さがあり、{縁|ふち}から尖った頂部に向かってなだらかに細くなります。一方、つばの広いノンラーは、つばが大きく、円錐形のものより背が低く、横に広がった形をしています。この二つのグループは、チュオン村の伝統的なノンラー作りに見られる形の多様性を示しています。',
      ],
      // "Nhóm nón chóp nhọn:" · "Nón vành rộng:" — thứ tự GVHD: chóp truyền thống, lá già, nhà sư, lụa, lụa hai mặt, cô dâu | Ba tầm, Quai thao, thúng
      groups: {
        pointed: ['Nhóm nón chóp nhọn', '{円錐形|えんすいけい}のノンラー'],
        wide: ['Nhóm nón vành rộng', 'つばの広いノンラー'],
      },
      // 08/11: ảnh mở mục theo bản Nhật (1-32, ông Tuy cung cấp); ảnh ông Tuy trong xưởng (2-03) về mục 2.1.1 như nhóm đặt
      hero: ['Cảnh làm nón ở làng Chuông — nguồn: nghệ nhân Lê Văn Tuy', 'チュオン{村|むら}でのノンラー製作の様子 — 出典：職人レ・ヴァン・トゥイ氏'],
      list: [
        {
          name: ['Nón lá hình chóp truyền thống', '伝統的な{円錐形|えんすいけい}のノンラー'],
          text: [
            'Đây là loại nón có dáng chóp nhọn, được làm từ lá lụi (lá cọ non) đã qua xử lý và khâu trên 16 vòng nứa. Nón thường có màu trắng sáng hoặc vàng ngà, bề mặt lá phẳng mượt với các đường chỉ khâu tương đối đều đặn. Thông thường, vành rộng của nón có đường kính mở rộng khoảng 30 đến 40 cm, tùy thuộc vào vóc dáng cùng mục đích sử dụng; kết hợp cùng chiều cao chóp từ 20 đến 25 cm giúp ôm vừa vặn vòm đầu mà vẫn giữ độ thông thoáng cần thiết. Với hình dáng gọn nhẹ và tính ứng dụng trong đời sống, loại nón này được sử dụng trong sinh hoạt hằng ngày và làm quà tặng.',
            '先端が尖った{円錐形|えんすいけい}で、下{処理|しょり}を{施|ほどこ}したラルイ（ヤシの若葉）を16本のヌアひごの{輪|わ}に{縫|ぬ}い{付|つ}けて作られます。色は一般に明るい白色または{淡|あわ}い{象牙色|ぞうげいろ}で、{葉|は}の表面は{平|たい}らに整えられ、縫い{目|め}も{比較的|ひかくてき}均一です。通常、ノンラーの{縁|ふち}の直径は、かぶる人の体格や用途に応じて約30～40cmです。縁から頂部までの高さは20～25cmで、こうした{寸法|すんぽう}により、頭にほどよくフィットしながら、必要な{通気性|つうきせい}も確保されています。かさばらず軽量で、日常生活での{実用性|じつようせい}もあるため、普段使いのほか、贈り{物|もの}にも用いられています。',
          ],
        },
        {
          name: ['Nón lá già ghép sống', '古いヤシの{葉|は}で作られたノンラー'],
          text: [
            'Đây là loại nón được làm từ lá cọ già, ghép và khâu cố định trên khung nón. Bề mặt nón có màu nâu nhạt, với các đường sống lá tỏa đều từ đỉnh xuống vành, kết hợp cùng các đường khâu ngang tạo thành kết cấu đặc trưng. So với nón chóp truyền thống có bề mặt lá phẳng và màu sắc sáng hơn, loại nón này nổi bật bởi các đường sống lá rõ nét, mang lại vẻ ngoài mộc mạc và khác biệt. Nón có kích thước tương đương với nón chóp truyền thống.',
            '古いヤシの{葉|は}を{継|つ}ぎ合わせ、ノンラーの{骨組|ほねぐ}みに{縫|ぬ}い{付|つ}けて固定したものです。表面は薄{茶色|ちゃいろ}で、頂部から{縁|ふち}に向かって均等に{放射状|ほうしゃじょう}に伸びる葉脈と、横方向の縫い{目|め}が{特徴|とくちょう}的な構造を形作っています。葉の表面が{平|たい}らで色も明るい伝統的な{円錐形|えんすいけい}のノンラーに比べ、葉脈がはっきりと見えるのが特徴で、{素朴|そぼく}で独特な外観を生み出しています。',
          ],
        },
        {
          name: ['Nón Ba tầm', 'ノン・バータム'],
          // Bổ sung 2 (12/11): "Ở bản dịch gửi lại đã bỏ câu có tên gọi khác là nón mười. Đổi lại lợp bằng lá lụi" ·
          // "e cứ copy phần bản dịch tiếng nhật bản chính thức sang" → bản Nhật nguyên văn tab パート1; bản Việt lá Hồ → lá lụi
          text: [
            'Là kiểu nón hội hè truyền thống của phụ nữ miền Bắc, còn có tên gọi khác là nón Mười (tên "Ba tầm" xuất phát từ kỹ thuật khâu ba vòng ở lòng nón). Nón nổi bật với kiểu dáng xòe rộng (đường kính 70–80 cm, thành cao 10–12 cm) và phần sườn cao nhất trong các dòng nón cổ, được lợp tỉ mỉ từ lá lụi tuyển chọn (nổi danh nhất là nón Làng Chuông). Xưa kia, từ các cô gái trẻ đến các cụ bà đều ưa chuộng đội nón Ba tầm khi đi hội, đi chùa hay trẩy chợ để tôn lên nét duyên dáng, thanh lịch. Ngày nay, nón không còn phổ biến trong sinh hoạt thường nhật mà chủ yếu xuất hiện trên sân khấu nghệ thuật, lễ hội truyền thống hoặc làm sản phẩm trưng bày di sản.',
            'ベトナム北部の女性が祭りの際にかぶる伝統的なノンラーです。「バータム」という名称は、ノンラーの内側を{三重|さんじゅう}の輪状に縫う技法に{由来|ゆらい}します。大きく広がった形（直径70～80cm、側面の高さ10～12cm）と、古くからあるノンラーの中で最も{骨組|ほねぐ}みが{特徴|とくちょう}です。{厳選|げんせん}したラルイを丁寧に重ねて作られ、なかでもチュオン{村|むら}のものが最もよく知られています。かつては、若い女性から年配の女性まで、祭りや{寺参|てらまい}り、市へ出かける際に、優美さや上品さを引き立てるために好んでかぶっていました。現在では、日常生活で使われることは少なくなりましたが、主に舞台芸術や伝統的な祭りで用いられるほか、{文化遺産|ぶんかいさん}を紹介する{展示|てんじ}品にもなっています。',
          ],
        },
        {
          name: ['Nón Quai thao', 'ノン・クアイ・タオ'],
          text: [
            'Là loại nón rộng vành gắn liền với trang phục truyền thống của phụ nữ Bắc Bộ, đặc biệt là hình ảnh các liền chị Quan họ trong dịp hội hè. Nón có ba kích cỡ phổ biến (đường kính 30 cm, 70 cm, 90 cm và thành cao 3–4 cm), đặc trưng với mặt nón rộng, tương đối phẳng, thành thấp, kết hợp cùng dây quai tết và các chùm thao trang trí rực rỡ quanh vành. Do đặc điểm cấu tạo, nón chủ yếu được dùng làm phụ kiện trang phục, tạo dáng trong lễ hội và biểu diễn văn hóa. Trong một số không gian giao duyên, nón còn được dùng làm khay đặt trầu têm cánh phụng để mời khách.',
            'ベトナム北部の女性の{伝統衣装|でんとういしょう}と深く結びついた、つばの広いノンラーです。一般的には三つのサイズ（直径30cm、70cm、90cm、側面の高さ3～4cm）があり、広く{比較的|ひかくてき}平らな{面|めん}と低い側面、編み込んだあご紐、{縁|ふち}の周囲を{彩|いろど}る鮮やかな{房飾|ふさかざ}りが{特徴|とくちょう}です。その構造から、主に衣装に添える{小物|こもの}として、祭りや文化公演で姿を美しく見せるために用いられます。また、男女が歌を{交|か}わす{場|ば}では、鳳凰の翼の形に整えたキンマを{載|の}せ、客にキンマを勧めるための{盆|ぼん}として使われることもあります。',
          ],
        },
        {
          name: ['Nón thúng', 'ノン・トゥン'],
          // 08/11: nguồn theo bản Nhật của nhóm (ノン・トゥン / グループ撮影) → ảnh nhóm, không ghi dòng nguồn riêng
          // 08/11 ("chú ý cả footnote nhé"): chú thích [7] [8] của bản Nhật; 14/11: bản Việt dịch theo
          notes: [
            ['¹ Áo tứ thân: trang phục dài đến giữa ống chân, xưa kia phụ nữ miền Bắc Việt Nam thường mặc. Áo gồm bốn vạt, hai vạt trước rộng bằng nhau, thường buộc chéo vào nhau.', '¹ アオ・トゥータン：かつてベトナム北部の女性が{着用|ちゃくよう}していた、すねの中ほどまでの長さの衣服です。四枚の{身頃|みごろ}からなり、前の二枚は同じ幅で、通常は{交差|こうさ}させて結びます。'],
            ['² Áo mớ ba mớ bảy: cách mặc nhiều lớp áo chồng lên nhau (áo trong, áo ngoài, áo đơn, áo kép…), thường dùng để chỉ lối ăn mặc sang trọng, giàu có.', '² アオ・モー・バー・モー・バイ：{内着|うちぎ}や上着、一重仕立てや{袷|あわせ}仕立ての衣服など、さまざまな衣服を重ねた装いです。通常、裕福で豪華な着こなしを表す際に使われる表現です。'],
          ],
          text: [
            'Là kiểu nón có vành rất rộng, dáng sâu lòng giống như cái thúng khi ngửa lên. Xưa kia, nón thúng kết hợp quai thao là món phụ kiện trang phục cao cấp đi cùng áo tứ thân¹, áo mớ ba mớ bảy² của các bà, các chị trong dịp lễ Tết, hội hè. Ngày nay, nón chủ yếu xuất hiện trong không gian biểu diễn nghệ thuật truyền thống hoặc đóng vai trò như sản phẩm quà tặng, trưng bày di sản.',
            'つばが非常に広く、深さがあり、裏返すとトゥン（竹編みのかご）のような形になるノンラーです。かつては、{飾|かざ}り{房|ふさ}の付いたあごひもを組み合わせたノン・トゥンが、女性たちの上質な装いの{小物|こもの}として、テト（ベトナムの旧{正月|しょうがつ}）などの祝祭日や祭りの際に、アオ・トゥータン¹やアオ・モー・バー・モー・バイ²（複数の{衣|ころも}を{重|かさ}ねる伝統的な装い）とともに用いられていました。現在では、主に伝統芸能の公演で使われるほか、贈答品や{文化遺産|ぶんかいさん}を紹介する{展示|てんじ}品としても用いられています。',
          ],
        },
        {
          name: ['Nón nhà sư (Nón thầy tu)', '{僧侶|そうりょ}用のノンラー'],
          text: [
            'Là loại nón có nguồn gốc cổ xưa từ Thanh Oai (Hà Nội), mang kiểu dáng rộng vượt khổ (đường kính khoảng 50 cm) để tạo sự cân đối khi kết hợp cùng áo cà sa phom rộng của chư tôn đức. Trong lịch sử, nón từng được đan thô sơ từ loại lá dày bởi thợ đan rổ rá với giá thành bình dân. Để đáp ứng tiêu chuẩn thẩm mỹ hiện đại, sản phẩm đã được cải tiến tinh tế: giữ đường kính rộng đặc trưng nhưng hạ thấp độ cao của chóp, tạo nên tổng thể thanh thoát, trang nhã và tôn lên phong thái thanh cao của nhà sư. Sự kết hợp này giúp nón nhà sư nhận được sự đánh giá rất cao, không chỉ phục vụ chư tăng ni trong nước mà còn vươn tầm quốc tế, được đón nhận tại Ấn Độ và nhiều quốc gia Phật giáo.',
            'ハノイのタインオアイに起源を持つ、古くからのノンラーです。直径約50cmという大ぶりな形が{特徴|とくちょう}で、{僧侶|そうりょ}がまとうゆったりとした{袈裟|けさ}と調和するように作られています。かつては、かごやざるを編む職人が厚手の{葉|は}を使って簡素に編み、手頃な価格で作っていました。現代の{美的|びてき}{基準|きじゅん}に{応|こた}えるため、特徴的な直径の広さを保ちながら頂部を低くするという、細やかな{改良|かいりょう}が加えられています。それによって、全体がすっきりと上品な姿に整えられ、僧侶の{気高|けだか}い{佇|たたず}まいを引き立てています。こうした工夫により、僧侶用のノンラーは非常に高く評価され、国内の僧侶や尼僧に用いられるだけでなく、海外にも広がり、インドや多くの{仏教国|ぶっきょうこく}で{受|う}け入れられています。',
          ],
        },
      ],
      styled: {
        h: ['Các mẫu nón cách điệu từ nón lá chóp truyền thống', '伝統的なノンラーをアレンジした製品'],
        list: [
          {
            name: ['Nón lụa', '絹張りのノンラー'],
            // 08/11: đúng ảnh nhóm gắn (1-39, 絹張りのノンラー / グループ撮影)
            text: [
              'Là sản phẩm được phát triển từ nón lá chóp truyền thống, có phần bên ngoài được bọc bằng lụa tơ tằm Vạn Phúc (Hà Đông). Sự kết hợp giữa kỹ thuật làm nón của Làng Chuông và chất liệu lụa với màu sắc, hoa văn đa dạng tạo nên diện mạo thanh lịch, phù hợp làm phụ kiện thời trang và quà lưu niệm.',
              '伝統的な{円錐形|えんすいけい}のノンラーをもとに開発された製品で、外側をヴァンフック（ハドン）の絹織物で覆っています。チュオン{村|むら}のノンラー作りの技術と、多彩な色や{柄|がら}の{絹|きぬ}を組み合わせることで、上品な外観に{仕上|しあ}げられており、ファッション{小物|こもの}や{土産|みやげ}物に適しています。',
            ],
          },
          {
            name: ['Nón lụa hai mặt', '内側と外側に絹布を使用したノンラー'],
            // 08/11 ~22h: nguồn theo mẫu "chú thích (nguồn)" — ảnh thư mục nghệ nhân Lê Văn Tuy → "(nghệ nhân Lê Văn Tuy cung cấp)"
            text: [
              'Được thiết kế với hai mặt có màu sắc hoặc họa tiết khác nhau, tạo sự đa dạng về hình thức trang trí. Sản phẩm giữ dáng nón chóp quen thuộc, đồng thời tăng tính linh hoạt trong cách phối màu và lựa chọn kiểu dáng, phù hợp làm phụ kiện thời trang và quà lưu niệm.',
              '内側と外側に{異|こと}なる色や{柄|がら}を用いることで、装飾に{変化|へんか}を持たせています。なじみのある{円錐形|えんすいけい}を保ちながら、配色やデザインの選択の幅を広げた製品で、ファッション{小物|こもの}や{土産|みやげ}物に適しています。',
            ],
          },
          {
            name: ['Nón cô dâu', '{花嫁|はなよめ}用のノンラー'],
            text: [
              'Là mẫu nón được cách điệu để phục vụ nhu cầu trang trí và chụp ảnh cưới. Bên cạnh hình dáng nón truyền thống, sản phẩm được trang trí thêm họa tiết ở mặt trong, tạo điểm nhấn khi nhìn từ phía dưới hoặc khi tạo dáng chụp ảnh. Thiết kế này mang đến diện mạo mới cho nón lá, kết hợp nét truyền thống với mục đích sử dụng trong các hoạt động cưới hỏi và lưu giữ kỷ niệm.',
              '{結婚|けっこん}式の装飾や記念{撮影|さつえい}のニーズに合わせて、現代風にアレンジされたノンラーです。伝統的な形状を保ちつつ、内側に{模様|もよう}が施されており、下から見上げたときや撮影のポーズをとる際に、良いアクセントとなります。',
            ],
          },
        ],
      },
      // Bổ sung 2 (12/11): "Trang 40: footnote OCOP（One Commune One Product）：…" (bản Nhật nguyên văn nhóm); bản Việt theo
      // chú thích [3] tab Chương 3 của nhóm
      outroNotes: [
        [
          '¹ OCOP (One Commune One Product - Mỗi xã một sản phẩm): chương trình của Việt Nam nhằm phát triển các sản phẩm đặc trưng địa phương, được đánh giá và phân hạng từ 1 đến 5 sao.',
          '¹ OCOP（One Commune One Product）：ベトナムの地域{特産品|とくさんひん}の開発・{振興|しんこう}を目的とした「一社一品運動」の{取|と}り{組|く}みです。製品は一定の{基準|きじゅん}に基づいて{評価|ひょうか}され、1つ星から5つ星までの{等級|とうきゅう}に分けられます。星の数が多いほど、評価が高いことを示します。',
        ],
      ],
      outro: [
        'Dự án lựa chọn nón lá chóp truyền thống Làng Chuông làm nội dung giới thiệu chính trong flipbook vì đây là kiểu nón có dáng chóp nhọn đặc trưng, gắn liền với hình ảnh người phụ nữ Việt Nam. Bên cạnh giá trị văn hóa và tính ứng dụng trong đời sống, nón lá chóp nhọn Làng Chuông còn được công nhận là sản phẩm OCOP¹ 4 sao, khẳng định giá trị của sản phẩm thủ công truyền thống tại địa phương. Đây cũng là dòng nón được sản xuất phổ biến tại làng nghề hiện nay. Vì vậy, flipbook sẽ giới thiệu khái quát về nón lá Làng Chuông, tập trung làm rõ đặc điểm của nón lá chóp truyền thống thông qua ba nội dung chính: khái quát, đặc điểm, cấu tạo – nguyên liệu – kỹ thuật chế tác nón lá, và quy trình sản xuất nón lá. Qua đó, flipbook cung cấp cái nhìn tổng quan về nón lá, các công đoạn làm nón và những nét đặc trưng trong kỹ thuật, tay nghề của người thợ Làng Chuông.',
        '本プロジェクトでは、チュオン{村|むら}の伝統的な{円錐形|えんすいけい}のノンラーを、フリップブックの主な紹介対象に選びました。先端が尖った{特徴|とくちょう}的な形を持ち、ベトナムの女性の姿と深く結びついているためです。文化的{価値|かち}や日常生活における{実用性|じつようせい}に加え、チュオン村の円錐形のノンラーはOCOP¹の4つ星{認定|にんてい}を{受|う}けており、地域の伝統工芸品としての価値が認められています。また、現在もこの{工芸村|こうげいむら}で広く生産されている{種類|しゅるい}です。そのため、本フリップブックでは、チュオン村のノンラーについて概説し、「{概要|がいよう}・特徴」「構造・{材料|ざいりょう}・{製作技術|せいさくぎじゅつ}」「製作工程」という三つの主要な内容を通して、伝統的な円錐形のノンラーの特徴を詳しく紹介します。これにより、ノンラーの全体像や各製作工程、チュオン村の職人の技術や熟練の技に見られる特徴を伝えます。',
      ],
    },
  },
}
