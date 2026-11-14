/**
 * Phần mở đầu: bìa, mục lục, lời mở đầu.
 * Mỗi đoạn là [tiếng Việt, tiếng Nhật]. Tiếng Việt lấy nguyên văn tab "Mở đầu" (Doc "ND + HT - Nón lá đã sửa",
 * bản sửa lần 1); tiếng Nhật: bản chính thức của nhóm (tab "JA はじめに", "JA 目次", tải 06/11/2026), chỉ sửa lỗi gõ
 * rõ ràng (danh sách: scripts/book/out/r0611/ja-p1.issues.md).
 * Mỗi chế độ đọc chỉ hiện một thứ tiếng (yêu cầu của nhóm): không chêm dòng tiếng còn lại.
 * Phiên âm chữ khó: {漢字|かんじ}.
 */
export const front = {
  title: ['Nón lá Làng Chuông', 'チュオン{村|むら}のノンラー'],
  subtitle: ['Nét đẹp truyền thống Việt Nam', 'ベトナムの{伝統美|でんとうび}'],
  team: ['Đồ án tốt nghiệp · Ngành Ngôn ngữ Nhật Bản\nTrường Đại học FPT Hà Nội · 2026', 'FPT大学ハノイ校 日本語学科\n卒業制作・2026年'],
}

export const preface = {
  title: ['Lời mở đầu', 'はじめに'],
  paras: [
    [
      'Từ lâu, chiếc nón lá đã trở thành hình ảnh quen thuộc trong đời sống của người Việt Nam. Từ những hoạt động lao động, sinh hoạt thường ngày đến các dịp lễ hội và biểu diễn văn hóa, chiếc nón hiện diện trong nhiều hoàn cảnh khác nhau. Trải qua thời gian, nón lá không chỉ là một vật dụng gắn bó với cuộc sống mà còn trở thành hình ảnh tiêu biểu, gợi nhắc đến nét đẹp giản dị và gần gũi của văn hóa Việt Nam.',
      'ノンラーは、古くからベトナムの人々の暮らしの中で{身近|みぢか}な{存在|そんざい}となっています。{日々|ひび}の仕事や生活から、祭りや文化公演に至るまで、さまざまな場面で使われています。時代とともに、ノンラーは暮らしに身近な道具であるだけでなく、ベトナム文化の{素朴|そぼく}で{親|した}しみやすい美しさを感じさせる{代表的|だいひょうてき}なイメージにもなっています。',
    ],
    [
      'Tùy theo điều kiện tự nhiên, nguồn nguyên liệu và tập quán sinh hoạt, mỗi vùng miền lại sáng tạo nên những kiểu nón mang đặc trưng riêng về hình dáng, cấu tạo cũng như kỹ thuật chế tác. Tại miền Bắc, làng Chuông (thành phố Hà Nội) là một trong những địa phương có nghề làm nón truyền thống nổi tiếng và lâu đời. Nơi đây từng sản xuất nhiều dòng nón khác nhau phục vụ nhu cầu đời sống. Ngày nay, chiếc nón lá hình chóp truyền thống vẫn là một trong những sản phẩm tiêu biểu của làng Chuông thể hiện kỹ thuật chế tác thủ công được gìn giữ và tiếp nối qua nhiều thế hệ.',
      'ベトナム各地では、{自然|しぜん}環境や原{材料|ざいりょう}、生活{習慣|しゅうかん}に応じて、形や{構造|こうぞう}、{製作技術|せいさくぎじゅつ}にそれぞれ{特徴|とくちょう}のあるノンラーが生み出されてきました。北部に位置するハノイ市のチュオン{村|むら}は、古くからノンラー作りが盛んに行われてきたことで知られる地域の一つです。かつて、この村では人々の暮らしの{需要|じゅよう}に応えるため、さまざまな種類のノンラーが作られていました。現在も、{伝統的|でんとうてき}な円錐形のノンラーはチュオン村を代表する製品の一つであり、何世代にもわたって守り継がれてきた製作技術が生かされています。',
    ],
    [
      'Với mong muốn giúp độc giả Nhật Bản có cái nhìn tổng quan và hiểu rõ hơn về nón lá làng Chuông, nhóm tác giả thực hiện cuốn flipbook “Nón lá làng Chuông – Nét đẹp truyền thống Việt Nam”. Cuốn flipbook gồm ba phần: Phần 1 “Khái quát về nón lá Việt Nam và nón lá Làng Chuông”, Phần 2 “Cấu tạo, nguyên liệu và kỹ thuật làm nón Làng Chuông” và Phần 3 “Những ghi nhận, hoạt động bảo tồn và thách thức đối với nón lá làng Chuông”.',
      '私たちは、日本の{読者|どくしゃ}の{皆様|みなさま}にチュオン{村|むら}のノンラーの{全体像|ぜんたいぞう}を知っていただき、{理解|りかい}を深めていただきたいという思いから、本フリップブック『チュオン村のノンラー：ベトナムの{伝統美|でんとうび}』を{制作|せいさく}しました。本書は、パート1「ベトナムのノンラーとチュオン村のノンラーの{概要|がいよう}」、パート2「チュオン村のノンラーの{構造|こうぞう}・{材料|ざいりょう}・{製作技術|せいさくぎじゅつ}」、パート3「チュオン村のノンラーの{評価|ひょうか}と{保存|ほぞん}・継承」の三つのパートで{構成|こうせい}されています。',
    ],
    [
      'Thông qua việc kết hợp tư liệu hình ảnh và các đoạn GIF mô tả quá trình chế tác, cuốn flipbook này giúp độc giả hình dung trực quan quy trình làm nón lá truyền thống. Những hình ảnh về thành phẩm, nguyên liệu, các công đoạn chế tác, không gian làng nghề và người làm nón góp phần minh họa, làm rõ thông tin, đồng thời mang đến góc nhìn trực quan về nghề làm nón truyền thống. Với cách trình bày sinh động và dễ tiếp cận, nhóm tác giả mong muốn mang đến cho độc giả một trải nghiệm đọc gần gũi và thú vị.',
      '本フリップブックでは、画像資料と製作工程を示すGIFアニメーションを{組|く}み合わせることで、{伝統的|でんとうてき}なノンラーが作られる過程を視覚的に{理解|りかい}できるようにしています。完成品や{材料|ざいりょう}、製作工程、{工芸村|こうげいむら}の{風景|ふうけい}、ノンラーを作る人々の画像は、本文の情報を補足し、内容をより分かりやすくするとともに、伝統的なノンラー作りの様子を視覚的に紹介するものです。こうした視覚的に分かりやすく、{親|した}しみやすい{構成|こうせい}を通じて、{読者|どくしゃ}の{皆様|みなさま}に楽しく読み進めていただける一冊を目指しています。',
    ],
    [
      'Hy vọng rằng, qua từng trang sách, độc giả Nhật Bản sẽ có cơ hội khám phá những nét đặc trưng của nón lá làng Chuông, đồng thời hiểu thêm về những con người và giá trị văn hóa gắn liền với nghề thủ công truyền thống này. Nhóm tác giả xin mời quý độc giả cùng bắt đầu hành trình tìm hiểu về nón lá làng Chuông qua cuốn flipbook này.',
      '本フリップブックを読み進める中で、日本の{読者|どくしゃ}の{皆様|みなさま}がチュオン{村|むら}のノンラーならではの{特徴|とくちょう}に触れ、この伝統工芸に{携|たずさ}わる人々や、それに結びついた文化的{価値|かち}について{理解|りかい}を深めていただければ幸いです。それでは、本フリップブックとともにチュオン村のノンラーについて学ぶ{旅|たび}を始めましょう。',
    ],
  ],
  sign: ['Hà Nội, tháng 11 năm 2026\nNhóm tác giả', 'ハノイ 2026年11月\n{著者|ちょしゃ}一同'],
  // góp ý 04/11: ảnh nhóm 4 người (Ảnh nhóm.jpg)
  photo: ['Bốn sinh viên ngành Ngôn ngữ Nhật Bản, Trường Đại học FPT Hà Nội', 'FPT大学ハノイ校日本語学科の学生4人'],
  contentsTitle: ['Cấu trúc cuốn sách', '本書の{構成|こうせい}'], // 14/11: bản Việt theo bản Nhật (本書の構成)
  chapters: [
    { icon: 'non', text: ['Nón lá trong đời sống, lịch sử và chân dung làng Chuông', '暮らしと歴史の中のノンラー、そしてチュオン村の{横顔|よこがお}'] },
    { icon: 'tool-quay-non', text: ['Ba lớp lá, mười sáu vành nứa và bảy bước dựng nên một chiếc nón', '三層の葉、十六本の輪、七つの工程から生まれる一つのノンラー'] },
    { icon: 'tre-mang', text: ['Những ghi nhận, nỗ lực bảo tồn và thách thức của nghề nón hôm nay', '評価と保存の取り組み、そして今日のノンラー作りが向き合う課題'] },
  ],
  turn: ['Mời bạn lật trang, cùng về làng Chuông →', 'さあ、ページをめくってチュオン村へ →'],
}

export const tocTitle = ['Mục lục', '{目次|もくじ}']
