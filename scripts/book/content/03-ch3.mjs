import { refs } from './refs.mjs'
/**
 * Chương 3 — Ghi nhận, bảo tồn nón Làng Chuông + phần kết. Mỗi đoạn: [tiếng Việt, tiếng Nhật]
 * Tiếng Việt: nguyên văn các tab "Chương 3", "Kết luận", "Trang kết" (Doc "ND + HT - Nón lá đã sửa", bản sửa lần 1);
 * tiếng Nhật: bản dịch chính thức của nhóm (tab "JA パート3", "JA 終わりに", "JA ありがとう", Doc tải 06/11/2026), thêm
 * phiên âm {漢字|かな} theo bản cũ; chỗ nhóm chưa dịch giữ bản tạm — xem scripts/book/out/r0611/ja-p3.issues.md.
 * Ông Lê Văn Tửu đã bỏ (nhóm chốt 06/11: còn bốn nghệ nhân).
 */
export const ch3 = {
  no: 3,
  label: ['Chương 3', 'パート3'],
  title: ['Ghi nhận, bảo tồn\nnón Làng Chuông', 'チュオン{村|むら}のノンラーの\n{評価|ひょうか}と{保存|ほぞん}・{継承|けいしょう}'],
  lead: [
    'Ở Chương 2, chúng ta đã cùng tìm hiểu cấu tạo, nguyên liệu và từng công đoạn tạo nên một chiếc nón làng Chuông. Qua các công đoạn chế tác, người thợ sử dụng kinh nghiệm và kỹ thuật thủ công để tạo nên một chiếc nón hoàn chỉnh từ những nguyên liệu truyền thống.\nKhông chỉ dừng lại ở quá trình chế tác, nghề nón làng Chuông còn mang những giá trị được ghi nhận và gìn giữ theo thời gian. Sang Chương 3 sẽ giới thiệu những ghi nhận đối với sản phẩm nón lá nói chung, song song với đó là sự ghi nhận với làng nghề và nghệ nhân, cùng các hoạt động bảo tồn, phát triển, những thách thức đối với chiếc nón, cũng như làng nghề làm nón hiện nay.',
    'パート2では、チュオン{村|むら}のノンラーの{構造|こうぞう}や{材料|ざいりょう}、製作{工程|こうてい}について紹介しました。これらの工程を通じて、職人たちは長年の経験と培ってきた製作技術を生かし、伝統的な材料を用いて一つのノンラーを完成させています。\nチュオン村のノンラーは、こうした製作技術とともに、地域の歴史や文化の中で受け継がれてきました。パート3では、チュオン村のノンラー製品、{工芸村|こうげいむら}、職人たちに対する{評価|ひょうか}や{認定|にんてい}について紹介します。さらに、伝統的なノンラー作りの{保存|ほぞん}・{継承|けいしょう}と発展に向けた{取|と}り{組|く}みや、現在{直面|ちょくめん}している{課題|かだい}についても取り上げます。',
  ],

  // ── 3.1
  recognition: {
    id: '3.1',
    title: ['Những ghi nhận đối với nón làng Chuông', 'チュオン{村|むら}のノンラーに対する{評価|ひょうか}'],
    h: ['Những ghi nhận đối với nón Chuông và làng nghề', 'チュオン{村|むら}のノンラーと{工芸村|こうげいむら}に対する{評価|ひょうか}'],
    proverb: ['“Muốn ăn cơm trắng cá trê,\nMuốn đội nón tốt thì về làng Chuông”', '「白いご{飯|はん}とナマズを食べたいなら、\n良いノンラーをかぶりたいなら、チュオン{村|むら}へ」'],
    p: [
      [
        'Câu ca dao được lưu truyền trong dân gian phần nào phản ánh danh tiếng lâu đời của nón làng Chuông. Trong cuốn Những làng nghề thủ công tiêu biểu của Thăng Long – Hà Nội do Đinh Hạnh chủ biên, có đoạn viết: “Từ xa xưa, nón làng Chuông là một trong những cống vật cung tiến hoàng hậu, công chúa bởi vẻ đẹp rất riêng được những bàn tay tài hoa, khéo léo của các nghệ nhân lành nghề làm nên”¹. Trước năm 1930, Hội làng nón được ghi nhận đã cấp chứng nhận chất lượng cho nón Chuông và đánh giá sản phẩm “còn cao hơn cả nón Huế”².',
        'このベトナムの民間{詩|し}からは、チュオン{村|むら}のノンラーが古くから評判を得ていたことがうかがえます。\nディン・ハイン{編|へん}『Những làng nghề thủ công tiêu biểu của Thăng Long - Hà Nội』には、次のように記されています。「古くから、チュオン村のノンラーは、熟練した職人たちの{優|すぐ}れた技術と{巧|たく}みな手仕事によって生み出される{独特|どくとく}の美しさゆえに、{皇后|こうごう}や{王女|おうじょ}への{献上品|けんじょうひん}の一つとされていました」¹。\nまた、1930年以前には、「Hội làng nón」と呼ばれる団体がチュオン村のノンラーの品質{証明|しょうめい}書を発行し、その品質を「フエのノンラー²をも上回る」と{評価|ひょうか}したことが記録されています。',
      ],
      [
        'Danh tiếng được lưu truyền qua nhiều thế hệ ấy tiếp tục được khẳng định bằng những hình thức công nhận trong thời kỳ hiện đại. Tên gọi “Nón Chuông” được Cục Sở hữu trí tuệ cấp chứng nhận nhãn hiệu tập thể, góp phần bảo hộ tên gọi của sản phẩm truyền thống. Năm 2021, sản phẩm “Nón lá làng Chuông” được đánh giá, phân hạng OCOP³ 4 sao. Những năm tiếp theo, các sản phẩm của nghệ nhân Lê Văn Tuy và Tạ Thu Hương cũng đạt hạng OCOP 4 sao, góp phần khẳng định chất lượng và giá trị của sản phẩm làng nghề.',
        '何世代にもわたって語り継がれてきたチュオン{村|むら}のノンラーの名声は、現代におけるさまざまな登録や{認定|にんてい}にも表れています。\n「ノン・チュオン（Nón Chuông）」という名称は、ベトナム国家知的財産庁によって{団体商標|だんたいしょうひょう}として登録され、伝統的な製品の名称の保護につながっています。\n2021年には、「チュオン村のノンラー」がOCOP³の4つ星製品として認定されました。その後も、職人のレ・ヴァン・トゥイ氏とタ・トゥ・フオン氏の事業所が手がけた製品がOCOPの4つ星認定を受け、チュオン村のノンラー製品の品質や価値を示す事例となっています。',
      ],
      [
        'Không chỉ sản phẩm, bản thân nghề làm nón cũng được ghi nhận ở cấp độ làng nghề. Năm 2008, làng Chuông cùng sáu làng khác thuộc xã Phương Trung (cũ), gồm Liên Tân, Tân Tiến, Quang Trung, Mã Kiều, Tây Sơn và Tân Dân, đã được UBND thành phố Hà Nội công nhận làng nghề. Bên cạnh đó, tính đến cuối năm 2013, các làng này tiếp tục được ghi nhận là làng nghề thủ công truyền thống của địa phương.',
        '製品だけでなく、チュオン{村|むら}もノンラー作りの{工芸村|こうげいむら}として{認定|にんてい}されています。2008年には、チュオン村と、当時同じフオンチュン{社|しゃ}（ベトナムの基礎行政区画）に属していたリエンタン、タンティエン、クアンチュン、マーキエウ、タイソン、タンザンの6つの村が、ハノイ市人民委員会によって工芸村として認定されました。また、2013年末までに、これらの村は伝統工芸村としても{認|みと}められました。',
      ],
      [
        'Những sự ghi nhận ấy không chỉ đánh dấu vị thế của nón Chuông và nghề làm nón mà còn góp phần tạo nền tảng cho các hoạt động gìn giữ và phát triển làng nghề trong đời sống hiện nay.',
        'こうした{認定|にんてい}は、チュオン{村|むら}のノンラー作りが地域の伝統工芸として{評価|ひょうか}されていることを示しています。また、ノンラーの{保存|ほぞん}・{継承|けいしょう}と発展に向けた{取|と}り{組|く}みを考えるうえでも、重要な意味を持っています。',
      ],
    ],
    notes: [
      ['¹ Đinh Hạnh (chủ biên), Những làng nghề thủ công tiêu biểu của Thăng Long – Hà Nội, NXB Hà Nội, 2019, tr. 122.', '¹ ディン・ハイン(編)『Những làng nghề thủ công tiêu biểu của Thăng Long - Hà Nội』、ハノイ出版社、2019年、122頁。'],
      ['² Nón Huế: Loại nón lá truyền thống nổi tiếng của vùng cố đô Huế (miền Trung Việt Nam), đặc trưng bởi dáng nón thanh mảnh, nhẹ và đường khâu tinh xảo. Tiêu biểu là nón bài thơ.', '² フエのノンラー：ベトナム中部の古都フエで作られてきた伝統的なノンラーです。軽さや丁寧な縫い目などが特徴として知られています。代表的な種類の一つに「ノン・バイ・トー（Nón bài thơ）」があります。'],
      ['³ OCOP (Chương trình Mỗi xã một sản phẩm): Chương trình của Việt Nam nhằm phát triển các sản phẩm đặc trưng địa phương, được đánh giá và phân hạng từ 1 đến 5 sao.', '³ OCOP（One Commune One Product）：ベトナムの地域{特産品|とくさんひん}の開発・振興を目的とした「一社一品運動」の{取|と}り{組|く}みです。製品は一定の基準に基づいて{評価|ひょうか}され、1つ星から5つ星までの等級に分けられます。星の数が多いほど、評価が高いことを示します。'],
    ],
    // 08/11 (tab Bổ sung: cặp trang OCOP tự dựng "Bỏ → Ảnh sẽ theo ND tiếng Nhật đã gán"): ảnh 3-02 … 3-09 của tab パート3,
    // mỗi nhóm ảnh đứng sau đúng đoạn như bản Nhật; chú thích JA nguyên văn nhóm, nguồn theo nhóm
    images: {
      colorful: ['Nón lá truyền thống và nhiều mẫu nón đầy màu sắc của làng Chuông — nguồn: nghệ nhân Tạ Thu Hương', 'チュオン{村|むら}の伝統的なノンラーと{色彩|しきさい}豊かなさまざまなノンラー — 出典：職人タ・トゥ・フオン氏'],
      products: ['Các sản phẩm nón đa dạng của làng Chuông', 'チュオン{村|むら}の{多彩|たさい}なノンラー製品'],
      ocop: [
        ['Giấy chứng nhận OCOP (4 sao) cho sản phẩm nón lá do UBND thành phố Hà Nội cấp năm 2022', '2022年にハノイ市人民委員会が発行したノンラー製品のOCOP{認定|にんてい}証（4つ星）'],
        ['Nón chùm của làng Chuông (nón treo trang trí) — sản phẩm OCOP 4 sao', 'チュオン{村|むら}の「ノンチュム」（吊り下げ飾り用のノンラー）- OCOP 4つ星{認定|にんてい}製品'],
      ],
      silk: [
        ['Nón lụa hai mặt (sắc đỏ) — nguồn: nghệ nhân Lê Văn Tuy', '内側と外側に{絹布|けんぷ}を使用したノンラー — 出典：職人レ・ヴァン・トゥイ氏'],
        ['Nón lụa hai mặt, mặt trong họa tiết lông vũ — nguồn: nghệ nhân Lê Văn Tuy', '内側と外側に{絹布|けんぷ}を使用したノンラー — 出典：職人レ・ヴァン・トゥイ氏'],
      ],
      // ảnh chợ của nhiếp ảnh Trọng Khải (nhóm ghi グループ撮影 — giữ ghi công người chụp, xem trang Nguồn ảnh)
      market: [
        ['Bàn tay người bán nâng chồng nón trắng', 'チュオン{村|むら}のノンラー市場で売られている伝統的なノンラー'],
        ['Người bán nón giữa những chồng nón trắng ở chợ Chuông', 'チュオン{村|むら}のノンラー市場で売られている伝統的なノンラー'],
      ],
    },
  },
  artisans: {
    title: ['Những ghi nhận đối với nghệ nhân tiêu biểu', 'チュオン{村|むら}を代表する職人たちの活動と{貢献|こうけん}'],
    // câu nói của hai nghệ nhân (tab "Câu nói hay" của Doc, bản tiếng Nhật do nhóm dịch) — in thành câu trích dẫn lớn
    sayings: {
      Tuy: ['“Mình cứ yêu nghề là yêu nước, cứ yêu nghề là nghề nào cũng thành công.”\n— Nghệ nhân Lê Văn Tuy', '「自分の仕事を愛することは、国を愛することにもつながると思います。どんな仕事でも、好きな気持ちがあれば、きっとうまくいきます。」\n— 職人レ・ヴァン・トゥイ'],
      Hương: ['“Muốn giữ nghề, người thợ phải vừa bảo tồn kỹ thuật truyền thống, vừa tìm cách để sản phẩm phù hợp hơn với nhu cầu của công chúng.”\n— Nghệ nhân Tạ Thu Hương', '「ノンラー作りを守っていくためには、昔からの技術を大切にしながら、今の人々のニーズに合うように製品を工夫していくことも必要だと思います。」\n— 職人タ・トゥ・フオン'],
    },
    intro: [
      'Các nghệ nhân làng Chuông có vai trò quan trọng trong việc khôi phục, gìn giữ kỹ thuật truyền thống và phát triển sản phẩm. Bốn nhân vật tiêu biểu được giới thiệu gồm ông Hai Cát (Lê Cát), nghệ nhân Phạm Trần Canh, Lê Văn Tuy và Tạ Thu Hương.',
      'チュオン{村|むら}の職人たちは、ノンラー作りの{復興|ふっこう}や伝統的な製作技術の{保存|ほぞん}・{継承|けいしょう}、製品の開発において重要な役割を果たしてきました。\nここでは、チュオン村を代表する職人として、ハイ・カット（Hai Cát）氏、ファム・チャン・カイン（Phạm Trần Canh）氏、レ・ヴァン・トゥイ（Lê Văn Tuy）氏、タ・トゥ・フオン（Tạ Thu Hương）氏の4人を紹介します。',
    ],
    groups: [
      {
        name: ['Những người giữ lại nghề', '伝統技術の{復興|ふっこう}・{復元|ふくげん}に{携|たずさ}わった職人たち'],
        people: [
          [['Ông Hai Cát (Lê Cát)', 'ハイ・カット（Hai Cát、生没年未確認）'], ['Góp phần khôi phục nghề nón', 'ノンラー作りの{復興|ふっこう}に{貢献|こうけん}'], ['Ông Hai Cát là một trong những người có đóng góp quan trọng trong việc khôi phục nghề nón làng Chuông sau thời kỳ suy thoái. Ông đã đưa mẫu nón Xuân Kiều (Ba Đồn) về làng sản xuất, góp phần cải tiến mẫu mã và nâng cao khả năng cạnh tranh của sản phẩm. Năm 1930, nón do ông chế tác được đánh giá cao tại Hội chợ Hà Đông. Sau đó, ông tiếp tục truyền dạy kỹ thuật làm nón tại nhiều địa phương.', 'ハイ・カット氏は、{衰退期|すいたいき}を{経|へ}たチュオン{村|むら}のノンラー作りの{復興|ふっこう}に大きく{貢献|こうけん}した人物の一人です。バードン（Ba Đồn）のスアンキエウ（Xuân Kiều）で作られていた型のノンラーをチュオン村に持ち帰り、その製作に{取|と}り入れました。これにより、製品のデザインの改良や{競争|きょうそう}力の向上に貢献しました。\n1930年には、同氏が製作したノンラーがハドン（Hà Đông）の見本市で高い{評価|ひょうか}を受けました。その後も、各地でノンラー作りの技術を教えました。']],
          // 08/11: dấu ¹ (chú thích [4] ハタイ省) chỉ có ở bản Nhật của nhóm
          [['Nghệ nhân Phạm Trần Canh (1931)', 'ファム・チャン・カイン（Phạm Trần Canh、1931年生・没年未確認）'], ['Phục dựng những mẫu nón cổ', '古いノンラーの様式を{復元|ふくげん}'], ['Nghệ nhân Phạm Trần Canh có đóng góp nổi bật trong việc phục dựng và bảo tồn các mẫu nón truyền thống, đặc biệt là nón quai thao cổ. Bên cạnh việc lưu giữ và chế tác các mẫu nón phục vụ triển lãm, ông còn truyền nghề miễn phí cho gần 100 người. Năm 2006, ông được phong danh hiệu Nghệ nhân làng nghề Hà Tây.', 'ファム・チャン・カイン氏は、伝統的なノンラーの様式の{復元|ふくげん}・{保存|ほぞん}に大きく{貢献|こうけん}し、特に古くから伝わるノン・クアイ・タオ（nón quai thao）の復元に力を注ぎました。\n展示用にさまざまな伝統的なノンラーを製作・保存するとともに、100人近くに{無償|むしょう}でノンラー作りの技術を伝えました。2006年には、「ハタイ{省|しょう}¹{工芸村|こうげいむら}職人（Nghệ nhân làng nghề Hà Tây）」の{称号|しょうごう}を授与されました。']],
        ],
      },
      {
        name: ['Những người đưa nghề đi tiếp', '伝統技術の{継承|けいしょう}と製品開発に{取|と}り組む職人たち'],
        intro: [
          'Bên cạnh việc gìn giữ những kỹ thuật được truyền lại, các thế hệ nghệ nhân tiếp nối còn tìm cách đổi mới mẫu mã, mở rộng công dụng và đưa sản phẩm đến với nhiều người hơn. Những đóng góp ấy được thể hiện qua hoạt động làm nghề của nghệ nhân Lê Văn Tuy và Tạ Thu Hương.',
          '伝統的な製作技術を守り継ぐとともに、製品の改良や用途の{拡大|かくだい}に{取|と}り組む職人たちもいます。ここでは、レ・ヴァン・トゥイ氏とタ・トゥ・フオン氏の活動を紹介します。',
        ],
        people: [
          [['Nghệ nhân Lê Văn Tuy (1969)', 'レ・ヴァン・トゥイ（Lê Văn Tuy、1969年生）'], ['Tiếp nối và đổi mới sản phẩm', '伝統技術の{継承|けいしょう}と製品の改良'], ['Nghệ nhân Lê Văn Tuy có đóng góp trong việc duy trì kỹ thuật làm nón truyền thống, cải tiến mẫu mã và truyền dạy nghề cho thế hệ trẻ. Ông tham gia hướng dẫn làm nón tại các trường học và giới thiệu sản phẩm làng Chuông đến với du khách. Năm 2019, ông được công nhận danh hiệu Nghệ nhân Hà Nội. Năm 2022, cơ sở sản xuất và kinh doanh nón lá Lê Văn Tuy có 5 sản phẩm được UBND thành phố Hà Nội công nhận OCOP 4 sao.', 'レ・ヴァン・トゥイ氏は、伝統的なノンラーの製作技術の維持・{継承|けいしょう}に加え、製品の改良や若い世代への技術の{伝承|でんしょう}に{取|と}り組んでいます。学校でノンラー作りの指導を行うほか、観光客にチュオン{村|むら}の製品を紹介する活動にも{携|たずさ}わっています。\n2019年には、「ハノイ市職人（Nghệ nhân Hà Nội）」の{称号|しょうごう}を授与されました。2022年には、同氏のノンラー製造・販売事業所が手がけた5製品¹が、ハノイ市人民委員会によってOCOPの4つ星製品として{認定|にんてい}されました。']],
          [['Nghệ nhân Tạ Thu Hương (1968)', 'タ・トゥ・フオン（Tạ Thu Hương、1968年生）'], ['Phát triển sản phẩm và mở rộng thị trường', '製品の開発と{販路|はんろ}の{拡大|かくだい}'], ['Nghệ nhân Tạ Thu Hương có đóng góp nổi bật trong việc đa dạng hóa sản phẩm và mở rộng thị trường tiêu thụ nón làng Chuông. Năm 2022, bà được công nhận danh hiệu “Nghệ nhân làng nghề” của Hiệp hội Du lịch thành phố Hà Nội. Cơ sở của bà đã phát triển nhiều mẫu nón phù hợp với nhu cầu hiện đại, trong đó có 6 sản phẩm được công nhận OCOP 4 sao. Sản phẩm của cơ sở cũng đã được đưa đến nhiều thị trường quốc tế, góp phần quảng bá nghề nón làng Chuông ra ngoài phạm vi địa phương.', 'タ・トゥ・フオン氏は、製品の{多様化|たようか}とチュオン{村|むら}のノンラーの{販路|はんろ}{拡大|かくだい}に大きく{貢献|こうけん}しています。2022年には、ハノイ市観光協会から「{工芸村|こうげいむら}職人（Nghệ nhân làng nghề）」の{称号|しょうごう}を授与されました。\n同氏の事業所では、現代のニーズに合ったさまざまなノンラーを開発しており、そのうち6製品¹がOCOPの4つ星{認定|にんてい}を受けています。また、同事業所の製品は海外の複数の市場にも届けられ、チュオン村のノンラー製品の販路拡大につながっています。']],
        ],
      },
    ],
    image: [
      ['Chân dung nghệ nhân Lê Văn Tuy', '職人レ・ヴァン・トゥイ氏'],
      // 08/11: đúng ảnh nhóm gắn (3-19)
      ['Nghệ nhân Tạ Thu Hương — nguồn: nghệ nhân Tạ Thu Hương', '職人タ・トゥ・フオン氏 — 出典：職人タ・トゥ・フオン氏'],
    ],
    // 08/11: ảnh nhóm gắn cho phần nghệ nhân (tab パート3, ảnh 3-11 … 3-21), chú thích JA nguyên văn nhóm
    photos: {
      // 3-10 / 3-11: cùng một ảnh nhóm gắn hai lần (cuối 3.1 và đầu phần nghệ nhân) → in một lần ở trang mở phần nghệ nhân
      honor: ['Năm 2025, các nghệ nhân tiêu biểu toàn quốc dự Lễ báo công dâng Bác — nguồn: Maries', '2025年、ホー・チ・ミン主席への活動報告式に参加した全国の代表的な職人たち — 出典：Maries'],
      canh: ['Nghệ nhân Phạm Trần Canh', '職人ファム・チャン・カイン氏'],
      hoa: ['Bà Trần Thị Hoa (sinh năm 1960), con gái nghệ nhân Phạm Trần Canh — nguồn: Báo Quân đội nhân dân', 'トラン・ティ・ホアさん（1960年生まれ）- 職人ファム・チャン・カイン氏の娘 — 出典：Báo Quân đội Nhân dân'],
      g2: [
        ['Nghệ nhân Lê Văn Tuy — nguồn: nghệ nhân Lê Văn Tuy', 'レ・ヴァン・トゥイ氏 — 出典：職人レ・ヴァン・トゥイ氏'],
        ['Nghệ nhân Tạ Thu Hương tại gian hàng nón của bà', 'タ・トゥ・フオン氏'],
      ],
      tuy: [
        ['Năm 2023, nghệ nhân Lê Văn Tuy (hàng thứ ba, thứ hai từ trái) chụp ảnh lưu niệm cùng Chủ tịch nước Võ Văn Thưởng', '2023年、ヴォー・ヴァン・トゥオン国家主席（当時）との記念写真。3列目左から2人目は職人レ・ヴァン・トゥイ氏'],
        ['Bằng công nhận danh hiệu Nghệ nhân Hà Nội (2019) của ông Lê Văn Tuy', '2019年にレ・ヴァン・トゥイ氏に{授与|じゅよ}された「ハノイ市職人」の{称号|しょうごう}{認定|にんてい}証'],
      ],
      huong: [
        ['Nghệ nhân Tạ Thu Hương (áo dài đỏ, ở giữa) giới thiệu sản phẩm nón lá', '中央の赤いアオザイ姿の職人タ・トゥ・フオン氏がノンラー製品を紹介する様子'],
        ['Một phần giấy khen, bằng khen nghệ nhân Tạ Thu Hương đã nhận', '職人タ・トゥ・フオン氏が受賞した賞状や表彰状の一部'],
      ],
    },
    // 08/11 ("chú ý cả footnote nhé"): chú thích [4] [5] [6] của bản Nhật — bản Việt không có, chỉ in ở bản Nhật
    notes: {
      Canh: [['', '¹ ハタイ{省|しょう}：2008年にハノイ市に{編入|へんにゅう}された、ベトナムの旧行政区画（省）です。']],
      Tuy: [['', '¹ レ・ヴァン・トゥイ氏の事業所におけるOCOP 4つ星{認定|にんてい}製品（5種類）：外側に絹布を使用したノンラー（Nón lá vải lụa mặt ngoài）、伝統的な特別仕様のノンラー（Nón lá truyền thống đặc biệt）、内側と外側の両面に絹布を使用したノンラー（Nón lá hai mặt lụa）、花嫁用のノンラー（Nón cô dâu）、ノン・チュム（吊り下げて飾るノンラー）（Nón chùm）']],
      // lỗi gõ đã sửa: 「（（平たくて…」 → 「（平たくて…」, khoảng trắng trước 「（Nón trắng kỹ đẹp）」
      Hương: [['', '¹ タ・トゥ・フオン氏の事業所におけるOCOP 4つ星{認定|にんてい}製品（6種類）：丁寧に仕上げられた白いノンラー（Nón trắng kỹ đẹp）、絹布を使用したノンラー（Nón lá trên lụa）、ノン・クアイ・タオ（平たくてつばの広い伝統的な笠 - Nón quai thao）、ノンラー・ボーデー（菩提樹の葉を用いたノンラー）（Nón lá bồ đề）、ノン・ラー・ザー・ゲップ・ソン (成熟したヤシの葉で作られたノンラー)（Nón lá già ghép sống）、吊り下げて飾るノンラー（Nón bộ treo trang trí decor）']],
    },
  },

  // ── 3.2
  preservation: {
    id: '3.2',
    title: ['Những hoạt động bảo tồn và phát triển nghề nón làng Chuông hiện nay', 'チュオン{村|むら}のノンラーの{保存|ほぞん}と発展に向けた現在の{取|と}り{組|く}み'],
    intro: [
      'Từ việc khôi phục những kỹ thuật truyền thống đến tìm kiếm hướng đi mới, các thế hệ nghệ nhân đã góp phần duy trì sức sống của nghề nón làng Chuông. Tiếp nối những đóng góp ấy, người dân và các cơ sở sản xuất tại làng Chuông đang từng bước đổi mới sản phẩm, mở rộng thị trường và phát triển các hoạt động quảng bá, trải nghiệm để nghề nón tiếp tục thích ứng với đời sống hiện nay.',
      '伝統的な製作技術の{復興|ふっこう}から新たな方向性の{模索|もさく}まで、各世代の職人たちは、チュオン{村|むら}のノンラー作りを支え、その伝統を受け継いできました。\nこうした{取|と}り{組|く}みを引き{継|つ}ぎ、現在、チュオン村の住民や製作事業者は、ノンラー作りを現代の暮らしに{適応|てきおう}させるため、製品の改良や{販路|はんろ}の{拡大|かくだい}を進めるとともに、広報活動や体験活動の充実にも取り組んでいます。',
    ],
    topics: [
      {
        h: ['Đổi mới sản phẩm và mở rộng công năng', '製品の開発・改良と用途の{拡大|かくだい}'],
        // trang phải: lưới ảnh sản phẩm sáng tạo (góp ý: bổ sung ảnh móc khóa, nón vẽ, nón lụa, nón mini…)
        gallery: true,
        // soát độc lập 08/11: giữ đúng thứ tự ảnh của nhóm (3-22 dưới đoạn dẫn, không đổi ảnh sơn mài 3-24 lên trước)
        keepOrder: true,
        p: [['Bên cạnh nón lá truyền thống, nghệ nhân làng Chuông đã phát triển thêm nhiều mẫu như nón thêu, nón vẽ, nón lụa, nón mini và các sản phẩm trang trí. Công năng của chiếc nón cũng được mở rộng từ vật dụng che nắng, che mưa sang phụ kiện áo dài, đạo cụ biểu diễn, quà lưu niệm và vật trang trí. Sự đổi mới này cho thấy sản phẩm nón làng Chuông đang được điều chỉnh để phù hợp hơn với nhu cầu sử dụng hiện nay.', '伝統的なノンラーに加え、チュオン{村|むら}の職人たちは、{刺繍|ししゅう}を施したノンラー、絵を描いたノンラー、絹を用いたノンラー、ミニサイズのノンラー、{装飾品|そうしょくひん}など、さまざまな製品を作り出してきました。\nノンラーの用途も、日よけや雨よけとして使うだけでなく、アオザイに合わせるアクセサリー、公演で使用する小道具、{土産|みやげ}物、装飾品などへと広がっています。こうした変化は、チュオン村のノンラー製品が、現代の人々の使用目的やニーズに合わせて改良されていることを示しています。']],
        // 08/11 (Zalo: "Gen lại ảnh theo thẻ tiếng Nhật"): ảnh 3-22 … 3-25 của tab パート3 (thay các ảnh Claude chọn trước đây)
        images: [
          ['Nón lá vẽ cờ đỏ sao vàng, nón lụa và nón vẽ hoa ở một cơ sở làng Chuông', 'チュオン{村|むら}の{多彩|たさい}な{装飾|そうしょく}用ノンラー'],
          ['Gian trưng bày nón của nghệ nhân Tạ Thu Hương', 'チュオン{村|むら}の伝統的なノンラーと{多彩|たさい}な{装飾|そうしょく}用ノンラー'],
          ['Nón lá vẽ hoa văn sơn mài — nguồn: Chạm Sắc (VTV5)', '「ノンラー・ソンマイ」（漆を塗って{装飾|そうしょく}したノンラー） — 出典：Chạm Sắc'],
          ['Trải nghiệm vẽ trên nón lá ở làng Chuông', 'チュオン{村|むら}でのノンラーへの絵画体験'],
        ],
      },
      {
        h: ['Từ chợ làng đến thị trường rộng hơn', '村の市場からより広い{販路|はんろ}へ'],
        p: [
          ['Chợ Chuông từ lâu đã gắn bó với hoạt động sản xuất và buôn bán nón lá của người dân địa phương. Chợ thường họp vào các ngày mùng 4, 10, 14, 20, 24 và 30 âm lịch hằng tháng, với hoạt động mua bán diễn ra từ sáng sớm. Tại đây, người dân bày bán các nguyên liệu và vật dụng làm nón như lá nón, cạp nón, cước, vòng nứa, cùng những chiếc nón đã hoàn thiện. Nón thường được xếp thành từng chồng, phân loại theo kiểu dáng, kích thước để thuận tiện cho việc lựa chọn và mua bán. Chợ không chỉ phục vụ nhu cầu sản xuất của người dân trong làng mà còn là nơi các thương lái thu mua nón để đưa đến nhiều địa phương khác, góp phần duy trì hoạt động tiêu thụ sản phẩm của làng nghề.', 'チュオン市場（Chợ Chuông）は、古くから地域住民によるノンラーの製作や売買と深く結びついてきました。市場は通常、{旧|きゅう}暦（ベトナムで伝統的に用いられてきた暦）の毎月4日、10日、14日、20日、24日、30日に開かれ、早朝から売買が行われます。\n市場では、ラルイ、外縁の輪、ナイロン糸、ヌアで作られた輪など、製作に必要な{材料|ざいりょう}や部品が、完成したノンラーとともに売られています。完成したノンラーは、形や大きさごとに分けられ、買い手が選びやすいように{積|つ}み{重|かさ}ねて並べられています。\nこの市場は、村の住民がノンラー作りに必要な材料を購入する場所であるだけでなく、{仲買人|なかがいにん}がノンラーを買い付け、各地へ運ぶ場所でもあります。このように、チュオン市場は村で作られたノンラーの販売を支える役割も果たしています。'],
          ['Từ những phiên chợ truyền thống, nón làng Chuông hiện còn được giới thiệu tại hội chợ, triển lãm, sự kiện văn hóa và các chương trình quảng bá làng nghề. Sản phẩm cũng từng xuất hiện tại một số sự kiện lớn như SEA Games và APEC. Bên cạnh đó, một số cơ sở sản xuất đã sử dụng mạng xã hội và các nền tảng trực tuyến để giới thiệu sản phẩm, nhận đơn hàng và tiếp cận khách hàng ngoài địa phương. Nón Chuông cũng đã được đưa đến một số thị trường quốc tế như Trung Quốc, Hàn Quốc, Nhật Bản, Đức…', 'チュオン市場のような伝統的な定期市に加え、現在では、チュオン{村|むら}のノンラーは見本市や展示会、文化イベント、{工芸村|こうげいむら}の広報活動などでも紹介されています。また、SEA Games¹やAPEC²関連の行事などで紹介されたこともあります。\nさらに、一部の製作事業者は、SNSやオンラインサービスを活用して製品を紹介し、注文を受け付けるとともに、地域外の顧客にも{情報|じょうほう}を発信しています。チュオン村のノンラーは中国、韓国、日本、ドイツなどの海外市場にも届けられています。'],
        ],
        // 08/11: ảnh 3-26, 3-27 (chợ lúc sáng sớm) cạnh đoạn về chợ ở trang trái; video sang trang phải, cạnh đoạn hội chợ /
        // SEA Games / thị trường quốc tế (tab Bổ sung: "Đổi vị trí ảnh → video để khớp với ND")
        pairLeft: true,
        images: [
          ['Chợ nón Chuông họp từ lúc tờ mờ sáng', '早朝からノンラーの売買でにぎわうチュオン市場'],
          ['Người vác hàng rời phiên chợ Chuông', '早朝からノンラーの売買でにぎわうチュオン市場'],
        ],
        video: ['Video: nón lá làng Chuông trên sàn diễn thời trang quốc tế — nguồn: nghệ nhân Lê Văn Tuy', '動画：国際ファッションショーに登場したチュオン{村|むら}のノンラー — 出典：職人レ・ヴァン・トゥイ氏'],
        // chú thích [7] [8] của bản Nhật (bản Việt không có) — cùng trang với đoạn SEA Games (trang phải)
        notesR: [
          ['', '¹ SEA Games（東南アジア競技大会）：東南アジア諸国が参加する総合スポーツ大会で、原則として2年に1回開催されます。'],
          ['', '² APEC（アジア太平洋経済協力）：アジア太平洋地域の21のエコノミー（国・地域）が参加し、貿易・投資の自由化や円滑化、経済・技術協力などを進める枠組みです。'],
        ],
      },
      {
        h: ['Gắn làng nghề với trải nghiệm, du lịch và giáo dục', '{工芸村|こうげいむら}における体験・観光・教育活動'],
        p: [
          ['Để nghề nón không chỉ được biết đến qua những sản phẩm hoàn chỉnh, các hoạt động giới thiệu và trải nghiệm nghề cũng ngày càng được chú trọng. Năm 2024, Trung tâm Thiết kế sáng tạo, giới thiệu, quảng bá và bán sản phẩm OCOP – làng nghề Nón Chuông được thành lập, tạo thêm không gian trưng bày, quảng bá và đưa sản phẩm của người làm nghề đến gần hơn với người dân và du khách.', '完成したノンラーの紹介にとどまらず、製作{工程|こうてい}の紹介や体験活動にも力が注がれています。\n2024年には、「チュオン{村|むら}のノンラー{工芸村|こうげいむら}におけるOCOP製品の創造的デザイン・紹介・広報・販売センター」が{設立|せつりつ}されました。こうした施設は、製品を紹介するだけでなく、地域住民や観光客がチュオン村のノンラーに接する場としても活用されています。'],
          ['Tại làng Chuông, một số gia đình và cơ sở sản xuất còn kết hợp làm nghề với hoạt động trải nghiệm, giúp học sinh và du khách quan sát quy trình chế tác, trực tiếp thử các công đoạn như khâu, vẽ hoặc trang trí nón.', 'チュオン{村|むら}では、一部の家庭や製作事業者がノンラーの製作と体験活動を{組|く}み合わせ、子どもたちや観光客が製作{工程|こうてい}を見学したり、ノンラーの縫い付けや絵付け、{装飾|そうしょく}などを実際に体験したりできる{機会|きかい}を提供しています。'],
          ['Không chỉ dừng lại ở những trải nghiệm thực tế, việc giới thiệu giá trị nghề truyền thống còn được mở rộng thông qua hoạt động giáo dục cộng đồng. Tháng 7/2026, chuyên đề “Nón làng Chuông – Từ di sản truyền thống đến giá trị kinh tế hiện đại” được triển khai tại Trung tâm Học tập cộng đồng xã Thanh Oai, một trong ba mô hình điểm của thành phố Hà Nội trong năm 2026.', 'こうした体験活動に加え、地域の教育活動を通じて伝統工芸の価値を伝える{取|と}り{組|く}みも行われています。2026年7月には、ハノイ市が同年にモデル拠点として選定した3つのコミュニティ学習センターの一つであるタインオアイ{社|しゃ}コミュニティ学習センターにおいて、「チュオン{村|むら}のノンラー: 伝統的な文化遺産から現代の経済的価値へ」をテーマとする{講座|こうざ}が実施されました。'],
        ],
        // trái: đoạn về Trung tâm OCOP (2024) · phải: trải nghiệm + giáo dục cộng đồng
        // 08/11: ảnh 3-29 … 3-34 của tab パート3 — trái: hai trung tâm OCOP (bà Hương, ông Tuy) cạnh đoạn về Trung tâm;
        // phải: lưới bốn ảnh trải nghiệm + biển lớp học
        pairLeft: true,
        // tab Bổ sung 08/11 khuya (lưới ảnh 133–136): "Chỉnh lại ảnh giúp chị, tránh bị cắt mất viền nhé" → khung đúng tỉ lệ ảnh gốc
        gallery: 'nat',
        images: [
          ['Trung tâm Thiết kế sáng tạo, giới thiệu, quảng bá và bán sản phẩm OCOP – làng nghề Nón Chuông, cơ sở của nghệ nhân Tạ Thu Hương', 'チュオン{村|むら}のノンラー{工芸村|こうげいむら}におけるOCOP製品の創造的デザイン・紹介・広報・販売センター（タ・トゥ・フオン氏の施設）'],
          ['Trung tâm thiết kế sáng tạo, giới thiệu, quảng bá và bán sản phẩm OCOP làng nghề nón Chuông — cơ sở của nghệ nhân Lê Văn Tuy', 'チュオン{村|むら}のノンラー{工芸村|こうげいむら}におけるOCOP製品の創造的デザイン・紹介・広報・販売センター（レ・ヴァン・トゥイ氏の施設）'],
          ['Du khách trải nghiệm vẽ nón ở làng Chuông', 'チュオン{村|むら}を訪れた観光客による伝統工芸体験'],
          ['Du khách nước ngoài trải nghiệm vẽ nón ở làng Chuông', 'チュオン{村|むら}を訪れた観光客による伝統工芸体験'],
          ['Trải nghiệm làm nón tại nhà nghệ nhân Lê Văn Tuy', 'チュオン{村|むら}でノンラー作りを体験する外国人観光客'],
          ['Biển “Lớp học giữ nghề nón làng Chuông”', 'チュオン{村|むら}の伝統的なノンラー作りを{継承|けいしょう}するための教室「Lớp học giữ nghề nón」の看板'],
        ],
      },
    ],
  },

  // ── 3.3
  challenges: {
    id: '3.3',
    title: ['Những thách thức đối với nghề nón làng Chuông hiện nay', 'チュオン{村|むら}のノンラーが抱える{課題|かだい}'],
    intro: [
      'Dù đã có nhiều nỗ lực trong việc gìn giữ và phát triển, nghề nón làng Chuông vẫn phải đối mặt với không ít khó khăn trong quá trình thích ứng với đời sống hiện đại.',
      '{保存|ほぞん}と発展に向けたさまざまな{取|と}り{組|く}みが進められているものの、チュオン{村|むら}のノンラーは、現在も多くの{課題|かだい}に{直面|ちょくめん}しています。',
    ],
    topics: [
      {
        h: ['Khó khăn trong việc tìm kiếm người kế thừa', '{後継者|こうけいしゃ}不足の{課題|かだい}'],
        p: [
          ['Nghề nón làng Chuông vẫn được duy trì tại nhiều gia đình, nhưng việc thu hút thế hệ trẻ tiếp nối nghề đang trở thành một khó khăn. Theo chia sẻ của nghệ nhân Lê Văn Tuy, số người trẻ học nghề ngày càng ít, trong khi những người thợ lành nghề đang dần lớn tuổi. Nhiều người trẻ lựa chọn học tập hoặc làm những công việc khác có thu nhập ổn định hơn.', 'チュオン{村|むら}では、現在も多くの家庭でノンラー作りが続けられていますが、若い世代にノンラー作りを受け継いでもらうことが難しくなっています。職人のレ・ヴァン・トゥイ（Lê Văn Tuy）氏によると、ノンラー作りを学ぶ若者は少なくなっている一方で、熟練した職人たちの{高齢化|こうれいか}が進んでいます。多くの若者は、学業を続けたり、より安定した収入が得られる別の仕事に就いたりしています。'],
          ['Việc thiếu người kế nghiệp có nguy cơ ảnh hưởng đến quá trình truyền nghề. Những kỹ thuật như chọn lá, tạo khuôn, khâu và hoàn thiện nón đòi hỏi sự khéo léo cùng kinh nghiệm được tích lũy qua nhiều năm thực hành. Nếu không có đủ người tiếp nối, một số kỹ năng truyền thống có thể dần bị mai một.', '{後継者|こうけいしゃ}不足は、技術の{継承|けいしょう}に{影響|えいきょう}を及ぼすおそれがあります。葉の選別、型作り、縫い付け、仕上げといった作業には、手先の器用さに加え、長年の経験が必要です。技術を受け継ぐ人が十分にいなければ、一部の伝統的な製作技術が次第に{失|うしな}われる可能性があります。'],
        ],
        // 08/11: ảnh 3-35 (đầu mục 3.3, ông Tuy cung cấp), 3-36, 3-37 của tab パート3
        gallery: true,
        images: [
          ['Người thợ làm nón truyền thống ở làng Chuông — nguồn: nghệ nhân Lê Văn Tuy', 'チュオン{村|むら}で伝統的なノンラーを製作する職人 — 出典：職人レ・ヴァン・トゥイ氏'],
          ['Cụ bà bán nón ở làng Chuông', 'チュオン{村|むら}でノンラーを販売する高齢の女性'],
          ['Người phụ nữ mang nón ở chợ Chuông', 'チュオン市場でノンラーを運ぶ女性'],
        ],
      },
      {
        h: ['Thu nhập từ nghề còn hạn chế', 'ノンラー作りによる収入の{課題|かだい}'],
        p: [
          ['Thu nhập từ nghề làm nón làng Chuông còn chưa tương xứng với thời gian và công sức của người thợ. Để hoàn thành một chiếc nón, người làm nghề phải trải qua nhiều công đoạn thủ công. Theo thông tin ghi nhận tại địa phương, một chiếc nón thông thường có thể mất khoảng 6 giờ để hoàn thiện, trong khi những chiếc nón đẹp, đòi hỏi kỹ thuật tỉ mỉ hơn có thể mất đến 10 giờ, thậm chí 2 ngày. Giá bán nón thông thường dao động từ 50.000 đến 120.000 đồng/chiếc. Tuy nhiên, thu nhập của người làm nón thường chỉ khoảng 3 triệu đồng/tháng, những tháng thuận lợi có thể đạt 5 triệu đồng.', 'チュオン{村|むら}では、ノンラー作りによる収入が、製作にかかる時間や労力に必ずしも見合っていないという{課題|かだい}があります。ノンラーを一つ完成させるには、いくつもの{工程|こうてい}を手作業で行う必要があります。\n現地で得られた{情報|じょうほう}によると、一般的なノンラーを一つ作るには約6時間かかります。一方、より{精巧|せいこう}なノンラーの場合は、細かな作業が必要となるため、約10時間、場合によっては2日かかることもあります。\n一般的なノンラーの販売価格は1個当たり5万～12万ベトナムドン程度です。しかし、ノンラー作りに{携|たずさ}わる人々の月収は通常約300万ベトナムドンで、仕事が順調な月には約500万ベトナムドンになることもあります。'],
          ['Sự chênh lệch giữa thời gian lao động và thu nhập khiến việc gắn bó lâu dài với nghề trở thành một lựa chọn khó khăn, nhất là đối với những người trẻ có thêm nhiều cơ hội việc làm khác.', 'このように、製作にかかる時間や労力に対して得られる収入が限られていることは、ノンラー作りを長く続けるうえでの{課題|かだい}となっています。特に、ほかにもさまざまな仕事を選べる若い世代にとって、この仕事を長く続けることは容易ではありません。'],
        ],
        // 08/11: ảnh 3-38, 3-39 của tab パート3
        images: [
          ['Người thợ cắt phần lá thừa của chiếc nón', '職人がノンラーの余分な葉を切り取っている様子'],
          ['Nụ cười người thợ làng Chuông bên chiếc nón', '完成したノンラーを持つ職人'],
        ],
      },
      {
        h: ['Khi chiếc nón phải tìm lại chỗ đứng trong đời sống hiện đại', '現代の暮らしの中で新たな役割を{模索|もさく}するノンラー'],
        p: [
          ['Từng là vật dụng quen thuộc để che nắng, che mưa, nón lá ngày nay không còn được sử dụng phổ biến như trước. Sự phát triển của các phương tiện giao thông cùng những lựa chọn như mũ bảo hiểm, mũ vải hay ô dù đã góp phần làm thay đổi thói quen sử dụng của người dân. Bên cạnh đó, nón Chuông còn phải cạnh tranh với các loại nón nhựa, nón sản xuất công nghiệp có giá chỉ khoảng 15.000 đồng/chiếc. Khi người mua khó phân biệt được nón thủ công truyền thống với các sản phẩm sản xuất công nghiệp, sự chênh lệch về giá càng khiến nón Chuông gặp bất lợi trong việc tiêu thụ.', 'かつてノンラーは、日よけや雨よけとして日常的に使われていました。しかし、現在では以前ほど広く使われなくなっています。交通手段の発達に加え、ヘルメットや布製の帽子、{傘|かさ}などが普及したことで、人々のノンラーを使う習慣も変化してきました。\nまた、チュオン{村|むら}のノンラーは、より安価なプラスチック製の笠や工場生産の笠との{競争|きょうそう}にも{直面|ちょくめん}しています。伝統的な手作りのノンラーは、製作に多くの時間と労力を要する一方、これらの製品は価格面で優位にあります。こうした価格{差|さ}により、チュオン村のノンラーは販売面でさらに厳しい状況に置かれています。'],
          ['Trước những thay đổi ấy, nón Chuông đang tìm thêm chỗ đứng trong lĩnh vực thời trang, biểu diễn, trang trí và du lịch. Đây vừa là cơ hội, vừa là thách thức. Những công dụng mới có thể mở ra hướng phát triển cho nón Chuông, nhưng đồng thời cũng đòi hỏi người làm nghề phải tiếp tục đổi mới để đáp ứng nhu cầu thị trường mà vẫn giữ được những nét đặc trưng của sản phẩm truyền thống.', 'こうした変化の中で、チュオン{村|むら}のノンラーは、ファッション、公演、{装飾|そうしょく}、観光など、さまざまな分野で新たな活用方法が{模索|もさく}されています。こうした新たな用途の広がりは、チュオン村のノンラーにとって発展の{機会|きかい}となる一方で、新たな{課題|かだい}も生み出しています。作り手には、伝統的な製品の特徴を守りながら、市場のニーズに合わせて製品の開発・改良を続けることが求められています。'],
        ],
        // 08/11: ảnh 3-40, 3-41 của tab パート3 (3-41 là ảnh mẫu chú thích nhóm gửi ở tab Bổ sung)
        images: [
          ['Du khách đội nón lá làng Chuông chụp ảnh lưu niệm', 'チュオン{村|むら}のノンラーをかぶり、記念{撮影|さつえい}を楽しむ観光客'],
          ['Nón trang trí làm phụ kiện thời trang — nguồn: nghệ nhân Tạ Thu Hương', 'ファッションアイテムとして使われる{装飾|そうしょく}用ノンラー — 出典：職人タ・トゥ・フオン氏'],
        ],
      },
    ],
    outro: [
      'Những khó khăn ấy cho thấy việc gìn giữ nghề nón làng Chuông không chỉ là bảo tồn kỹ thuật chế tác, mà còn là duy trì sinh kế cho người làm nghề, thu hút thế hệ kế tiếp và tìm được chỗ đứng cho chiếc nón trong đời sống hôm nay.',
      'これらの{課題|かだい}から、チュオン{村|むら}のノンラー作りを守るためには、伝統的な製作技術を守るだけでは十分でないことが分かります。作り手の生計を維持し、次の世代の担い手を増やすとともに、現代の暮らしの中でノンラーの位置づけを見いだしていくことも必要です。',
    ],
  },
}

export const ending = {
  conclusion: {
    title: ['Kết luận', '終わりに'],
    p: [
      [
        'Nón lá Làng Chuông là sản phẩm thủ công truyền thống mang đậm giá trị văn hóa và đời sống Việt Nam. Những đặc điểm về cấu tạo ba lớp, kỹ thuật chế tác cùng kinh nghiệm lâu năm của nghệ nhân đã tạo nên chất lượng và nét đặc trưng riêng của sản phẩm. Qua đó, nón Làng Chuông không chỉ thể hiện sự khéo léo trong tay nghề thủ công mà còn phản ánh những giá trị gắn liền với lịch sử và sinh hoạt cộng đồng địa phương.',
        'チュオン{村|むら}のノンラーは、ベトナムの文化や人々の暮らしと深く結びついた伝統工芸品です。三層{構造|こうぞう}や職人たちが長年にわたって培ってきた製作技術と経験が、製品の品質と{独自|どくじ}の特徴を生み出しています。チュオン村のノンラーには、職人たちの{優|すぐ}れた技術だけでなく、地域の歴史や人々の暮らしに根ざした文化的価値も表れています。',
      ],
      [
        'Trong đời sống hiện đại, nón lá làng Chuông đang có những thay đổi để phù hợp với nhu cầu sử dụng và thị trường. Bên cạnh chiếc nón lá trắng truyền thống, nhiều sản phẩm được phát triển thêm về kiểu dáng, cách trang trí và công năng, đồng thời được giới thiệu thông qua các hoạt động văn hóa và du lịch trải nghiệm. Tuy nhiên, những khó khăn về thị trường tiêu thụ, thu nhập của người làm nón và sự thiếu hụt lực lượng kế thừa vẫn ảnh hưởng đến việc duy trì sản xuất. Điều này cho thấy việc gìn giữ những đặc trưng truyền thống của nón Chuông cần gắn với đổi mới sản phẩm và tìm kiếm hướng phát triển phù hợp.',
        '現代では、チュオン{村|むら}のノンラーも人々のニーズや市場の変化に合わせて、その形や用途を広げています。伝統的な円錐形のノンラーに加え、形や{装飾|そうしょく}、用途に工夫を凝らしたさまざまな製品が開発され、文化活動や体験型観光を通じて紹介されています。一方で、{販路|はんろ}の確保や作り手の収入、{後継者|こうけいしゃ}不足といった{課題|かだい}は、ノンラーの製作を続けていくうえでの課題となっています。こうした状況から、チュオン村のノンラーの伝統的な特徴を守りながら、製品の改良を進め、今後の発展に向けた新たな方向性を探っていくことが大切だと考えられます。',
      ],
      [
        'Cuốn flipbook này được biên soạn nhằm cung cấp tài liệu giới thiệu và các thông tin tham khảo bằng tiếng Nhật về nón lá làng Chuông. Thông qua việc tổng hợp thông tin và hình ảnh thực tế, nhóm biên soạn mong muốn giới thiệu sản phẩm này đến những độc giả Nhật Bản quan tâm nón lá và các sản phẩm thủ công truyền thống của Việt Nam.',
        '本フリップブックはチュオン{村|むら}のノンラーを日本語で紹介し、{参考|さんこう}となる{情報|じょうほう}を提供することを目的として{制作|せいさく}しました。情報の収集・整理と写真資料をまとめ、ノンラーやベトナムの伝統工芸品に関心を持つ日本の読者に、チュオン村のノンラーを紹介したいと考えています。',
      ],
    ],
    quote: [
      '“Nón lá Làng Chuông không chỉ là một sản phẩm thủ công, mà là kết tinh của ký ức, bàn tay và tình yêu quê hương.”',
      '「チュオン村のノンラーは、単なる手工芸品ではなく、記憶と手仕事と{故郷|ふるさと}への愛の{結晶|けっしょう}なのです。」',
    ],
  },
  notice: {
    title: ['Lưu ý về nội dung', '内容に関する留意点'],
    p: [
      [
        'Cuốn flipbook tập trung giới thiệu những đặc điểm tiêu biểu của nón lá làng Chuông, đặc biệt là chiếc nón lá hình chóp truyền thống được sản xuất phổ biến hiện nay. Do giới hạn về phạm vi tìm hiểu và nguồn tư liệu, nội dung có thể chưa phản ánh đầy đủ tất cả các loại nón, kỹ thuật chế tác và những thay đổi của sản phẩm qua từng thời kỳ.',
        '本フリップブックでは、チュオン{村|むら}のノンラーの代表的な特徴を紹介しています。特に、現在広く製作されている伝統的な円錐形のノンラーを中心に{取|と}り上げました。調査の範囲や{参考|さんこう}資料には限りがあるため、ノンラーのすべての種類や製作技術、時代による変化を十分に紹介できていない可能性があります。',
      ],
      [
        'Bên cạnh đó, một số kỹ thuật và công đoạn làm nón có thể khác nhau giữa các hộ sản xuất hoặc thay đổi theo thời gian. Nhóm biên soạn đã cố gắng lựa chọn, đối chiếu và tổng hợp những thông tin phù hợp với phạm vi giới thiệu của flipbook. Các thông tin được chọn lọc dựa trên việc tham khảo tư liệu sách, báo, tạp chí, kết hợp với điều tra thực địa, quan sát thực tế và phỏng vấn các nghệ nhân. Tuy nhiên, nội dung chắc hẳn vẫn có thể còn những thiếu sót. Chúng tôi rất mong nhận được sự thông cảm và những ý kiến đóng góp từ quý độc giả.',
        'また、ノンラーの製作技術や{工程|こうてい}は、製作する家庭によって一部異なる場合があり、時代とともに変化することもあります。{編集|へんしゅう}チームでは、本フリップブックの紹介範囲に合った{情報|じょうほう}を選び、照らし合わせながらまとめるよう努めました。情報の収集にあたっては、書籍や新聞、雑誌などの資料を{参考|さんこう}にするとともに、{現地調査|げんちちょうさ}や観察、職人へのインタビューも行いました。それでも、内容には不十分な点が残っている可能性があります。読者の{皆様|みなさま}には、ご理解いただくとともに、ご意見やご指摘をお寄せいただければ幸いです。',
      ],
      [
        'Các thông tin từ việc điều tra khảo sát thực địa, phỏng vấn đều được nhóm tác giả xin phép người được phỏng vấn về việc sử dụng cho sản phẩm này. Sản phẩm là một dự án tốt nghiệp của sinh viên ngành Ngôn ngữ Nhật Bản trường Đại học FPT Hà Nội, chúng tôi cam kết không sử dụng với mục đích thương mại hay chính trị nào khác. Bởi vậy, mọi vấn đề về bản quyền chúng tôi cam kết việc không vi phạm khi tiến hành sản phẩm này.',
        '{現地調査|げんちちょうさ}やインタビューで得た{情報|じょうほう}については、本フリップブックで使用するにあたり、関係者本人の{許可|きょか}を得ています。本フリップブックは、FPT大学ハノイ校の日本語学科の学生による卒業プロジェクトとして{制作|せいさく}したものであり、商業的・政治的な目的で使用することはありません。また、制作にあたっては、著作権を尊重し、適切な許可や出典の明記などを通じて、権利の{侵害|しんがい}を防ぐよう努めています。',
      ],
      [
        'Cuối cùng, nhóm biên soạn xin chân thành cảm ơn quý độc giả đã dành thời gian thưởng thức cuốn flipbook này. Mọi ý kiến đóng góp, bình luận xin gửi về nhóm tác giả chúng tôi theo địa chỉ email:\nnonla09092026@gmail.com',
        '最後に、本書をお読みくださった皆様に心より{感謝|かんしゃ}申し上げます。ご意見・ご感想は、下記のメールアドレスまでお寄せください。\nnonla09092026@gmail.com',
      ],
    ],
  },
  team: {
    title: ['Nhóm thực hiện', '{制作|せいさく}チーム'],
    lead: [
      'Sản phẩm này là dự án tốt nghiệp của sinh viên ngành Ngôn ngữ Nhật Bản, Trường Đại học FPT Hà Nội, được thực hiện dưới sự hướng dẫn của giảng viên Nguyễn Thị Quế Hường.',
      '本フリップブック『チュオン{村|むら}のノンラー - ベトナムの伝統美』は FPT大学ハノイ校の日本語学科の学生がグエン・ティ・クエ・フオン先生の指導のもと、卒業プロジェクトとして{制作|せいさく}したものです。',
    ],
    membersTitle: ['Thành viên nhóm thực hiện', 'グループのメンバー'],
    members: [
      [['Phùng Thị Khánh Linh', 'フン・ティ・カイン・リン'], 'HA170019'],
      [['Mai Khánh Huyền', 'マイ・カイン・フエン'], 'HA16038'],
      [['Nguyễn Minh Ánh', 'グエン・ミン・アイン'], 'HA170145'],
      [['Nguyễn Thị Thu Nguyệt', 'グエン・ティ・トゥ・グエット'], 'HA160098'],
    ],
    contact: [
      'Nếu quý độc giả có bất kỳ ý kiến đóng góp hoặc câu hỏi nào, xin vui lòng gửi về địa chỉ email dưới đây.\nChúng tôi rất mong nhận được những ý kiến đóng góp từ quý độc giả.',
      '最後まで本フリップブックをお読みいただき、誠にありがとうございます。\nご質問やご意見がございましたら、以下のメールアドレスまでご連絡ください。{皆様|みなさま}からのご意見をお待ちしております。',
    ],
    email: 'nonla09092026@gmail.com',
  },
  references: {
    title: ['Tài liệu tham khảo', '{参考文献|さんこうぶんけん}'],
    // 55 mục, nguyên văn tab "Danh sách tài liệu tham khảo" của Doc (04/11/2026)
    items: refs,
  },
}
