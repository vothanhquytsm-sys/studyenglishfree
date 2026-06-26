// EnglishFree - Phản xạ tiếng Anh Module
// 100 Vietnamese sentences → user translates → auto check + grammar explanation

const REFLEX_SENTENCES = [
  // ── Nhóm 1: Câu khẳng định cơ bản ──
  { vi: "Tôi thực sự tin vào giấc mơ của bạn.", en: "I do believe in your dream.", tip: "Dùng <em>do/does</em> trước động từ nguyên thể để <strong>nhấn mạnh</strong> sự khẳng định mạnh mẽ.", highlight: "do believe" },
  { vi: "Cô ấy đang cố gắng hết sức mình.", en: "She is doing her best.", tip: "Thì <strong>hiện tại tiếp diễn</strong> (am/is/are + V-ing) diễn tả hành động đang xảy ra ngay lúc nói.", highlight: "is doing" },
  { vi: "Chúng tôi vừa mới đến nơi.", en: "We have just arrived.", tip: "<strong>Have/has + just + V3</strong> diễn tả hành động vừa hoàn thành gần đây, nhấn mạnh kết quả hiện tại.", highlight: "have just arrived" },
  { vi: "Anh ấy chưa bao giờ thất bại trong cuộc đời.", en: "He has never failed in his life.", tip: "<strong>Have/has + never + V3</strong> diễn tả kinh nghiệm chưa từng xảy ra trong suốt cuộc đời.", highlight: "has never failed" },
  { vi: "Tôi đã học tiếng Anh được 3 năm.", en: "I have been learning English for 3 years.", tip: "<strong>Hiện tại hoàn thành tiếp diễn</strong> (have been + V-ing) nhấn mạnh hành động kéo dài liên tục từ quá khứ đến hiện tại.", highlight: "have been learning" },

  // ── Nhóm 2: Câu phủ định ──
  { vi: "Tôi không hề biết điều đó.", en: "I had no idea about that.", tip: "<em>Have no idea</em> là cách diễn đạt tự nhiên hơn <em>don't know</em> khi muốn nói 'hoàn toàn không biết'.", highlight: "had no idea" },
  { vi: "Cô ấy không nên nói như vậy.", en: "She shouldn't have said that.", tip: "<strong>Shouldn't have + V3</strong> diễn tả sự hối tiếc về hành động đã xảy ra trong quá khứ (mang tính phê bình).", highlight: "shouldn't have said" },
  { vi: "Anh ấy chưa quyết định gì cả.", en: "He hasn't made up his mind yet.", tip: "<em>Make up one's mind</em> là cụm từ cố định nghĩa là 'đưa ra quyết định'. Dùng <em>yet</em> cuối câu phủ định.", highlight: "hasn't made up his mind" },
  { vi: "Chúng tôi không có thời gian để lãng phí.", en: "We have no time to waste.", tip: "<em>Have no time to + V</em> nhấn mạnh mạnh hơn <em>don't have time to</em> — không có lấy một chút thời gian.", highlight: "have no time to waste" },
  { vi: "Điều này không liên quan gì đến bạn.", en: "This has nothing to do with you.", tip: "<em>Have nothing to do with</em> là cụm cố định nghĩa 'không liên quan gì đến'. Đừng dịch thẳng từng từ.", highlight: "has nothing to do" },

  // ── Nhóm 3: Câu hỏi ──
  { vi: "Tại sao bạn lại đến trễ như vậy?", en: "Why are you so late?", tip: "Câu hỏi với <em>Why</em> dùng trợ động từ đảo lên trước chủ ngữ: <strong>Why + trợ động từ + S + V?</strong>", highlight: "are you so late" },
  { vi: "Bạn đã từng đến Anh chưa?", en: "Have you ever been to England?", tip: "<strong>Have you ever + V3</strong> hỏi về kinh nghiệm trong cuộc đời. Dùng <em>been to</em> khi muốn nói về nơi đã đến thăm.", highlight: "Have you ever been" },
  { vi: "Điều gì khiến bạn quyết định học tiếng Anh?", en: "What made you decide to learn English?", tip: "<em>What made you + V</em> hỏi về nguyên nhân hoặc động lực. Tự nhiên hơn <em>Why did you decide</em>.", highlight: "made you decide" },
  { vi: "Bạn có phiền nếu tôi mở cửa sổ không?", en: "Would you mind if I opened the window?", tip: "<strong>Would you mind if + S + V quá khứ</strong> là cách hỏi lịch sự nhất. Câu trả lời 'No' nghĩa là đồng ý.", highlight: "Would you mind if I opened" },
  { vi: "Bạn đang nghĩ gì vậy?", en: "What's on your mind?", tip: "<em>What's on your mind?</em> là cách hỏi tự nhiên 'Bạn đang nghĩ gì?' — thân thiện hơn <em>What are you thinking about?</em>", highlight: "on your mind" },

  // ── Nhóm 4: Tương lai ──
  { vi: "Tôi sẽ cố gắng hết sức.", en: "I will do my best.", tip: "<em>Do one's best</em> là idiom phổ biến nghĩa 'cố gắng hết sức'. Luôn dùng <em>do</em>, không phải <em>make</em>.", highlight: "do my best" },
  { vi: "Chúng ta sắp đến nơi rồi.", en: "We are about to arrive.", tip: "<strong>Be about to + V</strong> diễn tả hành động sắp xảy ra ngay lập tức — mạnh hơn <em>going to</em>.", highlight: "are about to arrive" },
  { vi: "Cô ấy có thể sẽ đến muộn.", en: "She might be late.", tip: "<strong>Might + V</strong> diễn tả khả năng thấp (khoảng 40-50%). Khác với <em>may</em> (50%) và <em>will</em> (chắc chắn).", highlight: "might be" },
  { vi: "Tôi dự định nghỉ hưu vào năm 60 tuổi.", en: "I plan to retire at the age of 60.", tip: "<em>Plan to + V</em> diễn tả kế hoạch có chủ đích. <em>At the age of</em> dùng chỉ độ tuổi cụ thể.", highlight: "plan to retire" },
  { vi: "Tôi sắp thi xong rồi.", en: "I'm almost done with my exams.", tip: "<em>Be done with</em> nghĩa là hoàn thành/kết thúc. <em>Almost</em> đặt trước tính từ hoặc trạng từ.", highlight: "almost done with" },

  // ── Nhóm 5: Quá khứ ──
  { vi: "Hồi nhỏ tôi rất thích đọc sách.", en: "I used to love reading books when I was young.", tip: "<strong>Used to + V</strong> diễn tả thói quen hoặc trạng thái trong quá khứ đã không còn nữa ở hiện tại.", highlight: "used to love" },
  { vi: "Anh ấy đã làm việc cả đêm để hoàn thành dự án.", en: "He worked through the night to finish the project.", tip: "<em>Work through the night</em> nghĩa là làm việc suốt đêm không ngủ. <em>Through</em> nhấn mạnh tính liên tục.", highlight: "worked through the night" },
  { vi: "Tôi đã ước mình học giỏi hơn khi còn nhỏ.", en: "I wish I had studied harder when I was young.", tip: "<strong>Wish + S + had + V3</strong> diễn tả sự hối tiếc về hành động trong quá khứ không thể thay đổi.", highlight: "had studied harder" },
  { vi: "Ngôi nhà đó từng là trường học.", en: "That building used to be a school.", tip: "<em>Used to be</em> dùng cho trạng thái trong quá khứ đã thay đổi. Không nhầm với <em>be used to</em> (quen với).", highlight: "used to be" },
  { vi: "Tôi đã nhầm từ đầu.", en: "I was wrong from the start.", tip: "<em>From the start</em> nghĩa 'từ đầu' — tự nhiên hơn <em>from the beginning</em> trong văn nói.", highlight: "from the start" },

  // ── Nhóm 6: Cảm xúc & Thái độ ──
  { vi: "Tôi rất vui khi được gặp bạn.", en: "I'm so glad to meet you.", tip: "<em>Glad</em> tự nhiên và ấm áp hơn <em>happy</em> trong tình huống gặp gỡ xã giao. <em>So</em> nhấn mạnh mức độ.", highlight: "so glad to meet" },
  { vi: "Anh ấy rất tức giận về chuyện đó.", en: "He was furious about it.", tip: "<em>Furious</em> mạnh hơn nhiều so với <em>angry</em> — diễn tả trạng thái tức giận tột độ.", highlight: "furious about" },
  { vi: "Tôi cảm thấy kiệt sức sau một ngày dài.", en: "I feel exhausted after a long day.", tip: "<em>Exhausted</em> mạnh hơn <em>tired</em> — hoàn toàn cạn kiệt năng lượng. Dùng <em>feel + tính từ</em>.", highlight: "feel exhausted" },
  { vi: "Cô ấy rất tự hào về thành tích của con trai.", en: "She is very proud of her son's achievement.", tip: "<em>Proud of</em> luôn đi với giới từ <em>of</em>, không phải <em>about</em>. Chú ý dùng sở hữu cách <em>'s</em>.", highlight: "proud of" },
  { vi: "Tôi thấy lo lắng mỗi khi phải nói trước đám đông.", en: "I feel nervous whenever I have to speak in public.", tip: "<em>Whenever</em> (= every time) dùng cho tình huống lặp đi lặp lại. <em>Speak in public</em> là cụm từ cố định.", highlight: "nervous whenever" },

  // ── Nhóm 7: Công việc & Học tập ──
  { vi: "Tôi đã nộp đơn xin việc hôm qua.", en: "I applied for the job yesterday.", tip: "<em>Apply for</em> (xin việc/học bổng). Không nhầm với <em>apply to</em> (nộp đơn vào tổ chức nào đó).", highlight: "applied for" },
  { vi: "Cô ấy được thăng chức sau 2 năm.", en: "She got promoted after two years.", tip: "<em>Get promoted</em> (thụ động — được thăng chức). Khác với <em>promote someone</em> (chủ động — thăng chức ai đó).", highlight: "got promoted" },
  { vi: "Tôi đang chuẩn bị cho kỳ thi IELTS.", en: "I'm preparing for the IELTS exam.", tip: "<em>Prepare for</em> + sự kiện/kỳ thi. Đừng dùng <em>prepare to</em> trong trường hợp này — hai giới từ có nghĩa khác nhau.", highlight: "preparing for" },
  { vi: "Anh ấy bỏ lỡ deadline vì không tập trung.", en: "He missed the deadline because he lost focus.", tip: "<em>Miss the deadline</em> (bỏ lỡ hạn chót). <em>Lose focus</em> (mất tập trung) — tự nhiên hơn <em>couldn't concentrate</em>.", highlight: "missed the deadline" },
  { vi: "Dự án này yêu cầu rất nhiều sự kiên nhẫn.", en: "This project requires a great deal of patience.", tip: "<em>A great deal of</em> + danh từ không đếm được (như patience, time, money). Mạnh hơn <em>a lot of</em>.", highlight: "a great deal of patience" },

  // ── Nhóm 8: Mối quan hệ ──
  { vi: "Chúng tôi đã quen nhau từ hồi còn đi học.", en: "We've known each other since school.", tip: "<em>Know each other</em> (quen biết nhau). Dùng <em>since + mốc thời gian</em> với thì hoàn thành.", highlight: "known each other since" },
  { vi: "Anh ấy luôn ủng hộ tôi trong mọi hoàn cảnh.", en: "He always stands by me no matter what.", tip: "<em>Stand by someone</em> = ủng hộ/không bỏ rơi ai. <em>No matter what</em> = dù bất kỳ điều gì xảy ra.", highlight: "stands by me" },
  { vi: "Họ đã chia tay sau 3 năm hẹn hò.", en: "They broke up after three years of dating.", tip: "<em>Break up</em> = chia tay (quan hệ tình cảm). <em>After + khoảng thời gian + of + V-ing</em>.", highlight: "broke up" },
  { vi: "Tôi rất biết ơn sự giúp đỡ của bạn.", en: "I'm really grateful for your help.", tip: "<em>Grateful for</em> (biết ơn về điều gì). Mạnh hơn <em>thankful</em>. Luôn dùng giới từ <em>for</em>.", highlight: "grateful for" },
  { vi: "Cô ấy rất khó tính trong các mối quan hệ.", en: "She is very demanding in relationships.", tip: "<em>Demanding</em> = đòi hỏi cao/khó tính. Thường dùng trong ngữ cảnh mô tả tính cách của người khác.", highlight: "demanding in relationships" },

  // ── Nhóm 9: Sức khỏe & Thể thao ──
  { vi: "Bạn nên chạy bộ ít nhất 30 phút mỗi ngày.", en: "You should go jogging for at least 30 minutes a day.", tip: "<em>Go jogging/swimming/cycling</em> — dùng <em>go + V-ing</em> cho các hoạt động thể thao giải trí.", highlight: "go jogging" },
  { vi: "Tôi bị cảm lạnh sau khi ra ngoài mưa.", en: "I caught a cold after going out in the rain.", tip: "<em>Catch a cold</em> (bị cảm lạnh) — cụm từ cố định. Không dùng <em>get cold</em> để nói về bệnh.", highlight: "caught a cold" },
  { vi: "Hãy uống đủ nước mỗi ngày để tốt cho sức khỏe.", en: "Drink enough water every day to stay healthy.", tip: "<em>Stay healthy</em> (duy trì sức khỏe tốt) tự nhiên hơn <em>be healthy</em> khi nói về thói quen.", highlight: "stay healthy" },
  { vi: "Anh ấy đã giảm được 5 kg nhờ ăn kiêng.", en: "He lost 5 kilograms by dieting.", tip: "<em>Lose weight / lose kilograms</em> (giảm cân). <em>By + V-ing</em> diễn tả phương pháp/cách thức.", highlight: "lost 5 kilograms by dieting" },
  { vi: "Ngủ đủ giấc rất quan trọng với sức khỏe tâm thần.", en: "Getting enough sleep is crucial for mental health.", tip: "<em>Gerund (V-ing)</em> làm chủ ngữ. <em>Crucial for</em> mạnh hơn <em>important for</em> — tuyệt đối cần thiết.", highlight: "Getting enough sleep" },

  // ── Nhóm 10: Du lịch & Địa điểm ──
  { vi: "Chúng tôi đặt khách sạn trước 2 tuần.", en: "We booked the hotel two weeks in advance.", tip: "<em>Book in advance</em> = đặt trước. <em>In advance</em> (trước thời hạn) đặt cuối câu hoặc sau mốc thời gian.", highlight: "in advance" },
  { vi: "Chuyến bay bị hoãn 3 tiếng vì thời tiết xấu.", en: "The flight was delayed by three hours due to bad weather.", tip: "<em>Be delayed by + khoảng thời gian</em> (bị hoãn bao lâu). <em>Due to</em> (do/vì) + danh từ/cụm danh từ.", highlight: "delayed by three hours due to" },
  { vi: "Tôi đã lạc đường ở thành phố mới.", en: "I got lost in the new city.", tip: "<em>Get lost</em> = bị lạc đường — luôn dùng <em>get</em>, không phải <em>be</em> khi diễn tả quá trình.", highlight: "got lost" },
  { vi: "Phong cảnh ở đây thật tuyệt vời.", en: "The scenery here is breathtaking.", tip: "<em>Breathtaking</em> = ngoạn mục đến mức 'nín thở'. Mạnh hơn <em>beautiful</em>. <em>Scenery</em> không có số nhiều.", highlight: "breathtaking" },
  { vi: "Chúng tôi đã đi bộ hơn 10 km để đến đây.", en: "We hiked over 10 kilometers to get here.", tip: "<em>Hike</em> (đi bộ đường dài/leo núi) tự nhiên hơn <em>walk</em> khi nói về khoảng cách lớn trong thiên nhiên.", highlight: "hiked over 10 kilometers" },

  // ── Nhóm 11: Môi trường ──
  { vi: "Biến đổi khí hậu đang ảnh hưởng đến toàn thế giới.", en: "Climate change is affecting the entire world.", tip: "Thì <strong>hiện tại tiếp diễn</strong> (is affecting) nhấn mạnh vấn đề đang diễn ra ngay bây giờ và còn tiếp diễn.", highlight: "is affecting" },
  { vi: "Chúng ta cần giảm thiểu việc sử dụng nhựa.", en: "We need to reduce the use of plastic.", tip: "<em>Reduce</em> (giảm thiểu) + <em>the use of</em> + danh từ. Tự nhiên hơn <em>use less plastic</em> trong văn viết.", highlight: "reduce the use of plastic" },
  { vi: "Rừng bị chặt phá với tốc độ đáng báo động.", en: "Forests are being cut down at an alarming rate.", tip: "<strong>Thụ động tiếp diễn</strong>: are being + V3. <em>At an alarming rate</em> = với tốc độ đáng báo động.", highlight: "are being cut down" },
  { vi: "Năng lượng mặt trời ngày càng phổ biến hơn.", en: "Solar energy is becoming increasingly popular.", tip: "<em>Increasingly</em> (ngày càng) + tính từ diễn tả xu hướng tăng dần. Tự nhiên hơn <em>more and more popular</em>.", highlight: "increasingly popular" },
  { vi: "Mỗi người chúng ta có trách nhiệm bảo vệ Trái Đất.", en: "Each of us has a responsibility to protect the Earth.", tip: "<em>Each of us</em> dùng động từ số ít (<em>has</em>). <em>Have a responsibility to + V</em> (có trách nhiệm làm gì).", highlight: "has a responsibility to protect" },

  // ── Nhóm 12: Công nghệ ──
  { vi: "Trí tuệ nhân tạo đang thay đổi cách chúng ta làm việc.", en: "Artificial intelligence is changing the way we work.", tip: "<em>The way + S + V</em> (cách mà...) là cấu trúc quan trọng. Không cần <em>in which</em> trong văn nói.", highlight: "the way we work" },
  { vi: "Điện thoại thông minh đã trở thành một phần không thể thiếu trong cuộc sống.", en: "Smartphones have become an indispensable part of our lives.", tip: "<em>Indispensable</em> (không thể thiếu) — từ học thuật cao cấp. Cần dùng thì hiện tại hoàn thành vì kết quả vẫn còn.", highlight: "have become indispensable" },
  { vi: "Hãy cẩn thận với thông tin sai lệch trên mạng.", en: "Be careful about misinformation online.", tip: "<em>Misinformation</em> (thông tin sai lệch) — danh từ không đếm được. <em>Be careful about</em> cảnh báo về điều gì đó.", highlight: "misinformation online" },
  { vi: "Tôi gặp sự cố với máy tính của mình.", en: "I'm having trouble with my computer.", tip: "<em>Have trouble with</em> + danh từ. Hoặc <em>have trouble + V-ing</em>. Cả hai đều đúng và tự nhiên.", highlight: "having trouble with" },
  { vi: "Ứng dụng này giúp tôi tiết kiệm rất nhiều thời gian.", en: "This app saves me a lot of time.", tip: "<em>Save someone time/money</em> (giúp ai tiết kiệm thời gian/tiền). Cấu trúc: S + save + O + danh từ.", highlight: "saves me a lot of time" },

  // ── Nhóm 13: Giáo dục ──
  { vi: "Giáo dục là chìa khóa để thành công.", en: "Education is the key to success.", tip: "<em>The key to</em> + danh từ/V-ing (chìa khóa để...). Luôn dùng <em>to</em> sau <em>key</em>, không dùng <em>for</em>.", highlight: "the key to success" },
  { vi: "Học sinh ngày nay chịu rất nhiều áp lực.", en: "Students nowadays are under a lot of pressure.", tip: "<em>Be under pressure</em> (chịu áp lực) — cụm từ cố định. <em>Nowadays</em> đặt đầu hoặc cuối câu.", highlight: "under a lot of pressure" },
  { vi: "Cô giáo tôi đã truyền cảm hứng cho tôi học tiếng Anh.", en: "My teacher inspired me to learn English.", tip: "<em>Inspire someone to + V</em> (truyền cảm hứng cho ai làm gì). Cấu trúc phổ biến trong văn viết lẫn nói.", highlight: "inspired me to learn" },
  { vi: "Học qua thực hành hiệu quả hơn học lý thuyết.", en: "Learning by doing is more effective than learning theory.", tip: "<em>Learning by doing</em> — gerund làm chủ ngữ. <em>More effective than</em> dùng so sánh hơn.", highlight: "Learning by doing" },
  { vi: "Tôi không thể tập trung vì quá ồn ào.", en: "I can't concentrate because it's too noisy.", tip: "<em>Concentrate</em> (tập trung — không cần tân ngữ trực tiếp). <em>Too + tính từ</em> diễn tả quá mức, gây ra hậu quả.", highlight: "can't concentrate" },

  // ── Nhóm 14: Kinh doanh ──
  { vi: "Công ty chúng tôi đang mở rộng sang thị trường châu Á.", en: "Our company is expanding into the Asian market.", tip: "<em>Expand into</em> (mở rộng sang/vào) + thị trường/lĩnh vực mới. Không dùng <em>expand to</em>.", highlight: "expanding into" },
  { vi: "Chúng tôi cần đưa ra quyết định trước thứ Sáu.", en: "We need to make a decision before Friday.", tip: "<em>Make a decision</em> (không dùng <em>take</em> trong tiếng Anh-Mỹ). Collocations quan trọng trong tiếng Anh.", highlight: "make a decision" },
  { vi: "Doanh thu của chúng tôi đã tăng 20% so với năm ngoái.", en: "Our revenue increased by 20% compared to last year.", tip: "<em>Increase by + phần trăm</em> (tăng bao nhiêu %). <em>Compared to</em> (so với) + mốc so sánh.", highlight: "increased by 20%" },
  { vi: "Chúng tôi đang tìm kiếm đối tác đầu tư.", en: "We are looking for potential investors.", tip: "<em>Look for</em> (tìm kiếm). <em>Investors</em> (nhà đầu tư). <em>Potential</em> (tiềm năng) — từ thường dùng trong kinh doanh.", highlight: "looking for potential investors" },
  { vi: "Khách hàng là ưu tiên hàng đầu của chúng tôi.", en: "Customers are our top priority.", tip: "<em>Top priority</em> (ưu tiên hàng đầu) — cụm từ thông dụng trong kinh doanh. <em>Priority</em> không cần <em>the most</em>.", highlight: "top priority" },

  // ── Nhóm 15: Xã hội & Cuộc sống ──
  { vi: "Khoảng cách giàu nghèo ngày càng tăng.", en: "The gap between the rich and the poor is widening.", tip: "<em>The rich / the poor</em> (người giàu/nghèo) — dùng <em>the</em> + tính từ chỉ nhóm người. <em>Widen</em> (mở rộng dần).", highlight: "the gap is widening" },
  { vi: "Mọi người nên tôn trọng sự khác biệt của nhau.", en: "People should respect each other's differences.", tip: "<em>Each other's</em> = của nhau (sở hữu tương hỗ). Nhớ thêm <em>'s</em> để diễn tả sự sở hữu.", highlight: "each other's differences" },
  { vi: "Tình nguyện viên đóng vai trò quan trọng trong xã hội.", en: "Volunteers play a vital role in society.", tip: "<em>Play a role in</em> (đóng vai trò trong). <em>Vital</em> mạnh hơn <em>important</em> — cực kỳ quan trọng.", highlight: "play a vital role" },
  { vi: "Vấn đề nhà ở đang là mối lo ngại lớn.", en: "The housing problem is a major concern.", tip: "<em>Major concern</em> (mối lo ngại lớn) — cụm từ học thuật. Thường dùng trong IELTS Writing Task 2.", highlight: "major concern" },
  { vi: "Đô thị hóa đang diễn ra với tốc độ nhanh chưa từng thấy.", en: "Urbanization is occurring at an unprecedented rate.", tip: "<em>Unprecedented</em> (chưa từng có tiền lệ) — từ học thuật cao cấp. <em>At a rate</em> + tính từ diễn tả tốc độ.", highlight: "unprecedented rate" },

  // ── Nhóm 16: Conditional ──
  { vi: "Nếu trời không mưa, chúng tôi sẽ đi dã ngoại.", en: "If it doesn't rain, we will go on a picnic.", tip: "<strong>Conditional loại 1</strong>: If + S + V (hiện tại), S + will + V. Diễn tả tình huống có thể xảy ra.", highlight: "If it doesn't rain, we will" },
  { vi: "Nếu tôi giàu, tôi sẽ đi du lịch vòng quanh thế giới.", en: "If I were rich, I would travel around the world.", tip: "<strong>Conditional loại 2</strong>: If + S + were/V quá khứ, S + would + V. Dùng <em>were</em> (không phải <em>was</em>) cho mọi ngôi.", highlight: "If I were rich, I would" },
  { vi: "Giá như tôi đã học chăm hơn.", en: "If only I had studied harder.", tip: "<em>If only + S + had + V3</em> diễn tả sự hối tiếc mạnh mẽ về quá khứ. Mạnh hơn <em>I wish I had...</em>", highlight: "If only I had studied" },
  { vi: "Chỉ cần bạn cố gắng, bạn sẽ thành công.", en: "As long as you try, you will succeed.", tip: "<em>As long as</em> (miễn là/chỉ cần) = điều kiện duy nhất cần thiết. Dùng thay cho <em>if</em> để nhấn mạnh.", highlight: "As long as you try" },
  { vi: "Dù thế nào đi nữa, tôi cũng sẽ ủng hộ bạn.", en: "No matter what happens, I will support you.", tip: "<em>No matter what</em> (dù điều gì xảy ra) — nhấn mạnh tính vô điều kiện. Thường đặt đầu câu.", highlight: "No matter what happens" },

  // ── Nhóm 17: Passive voice ──
  { vi: "Quyển sách này đã được dịch sang 20 ngôn ngữ.", en: "This book has been translated into 20 languages.", tip: "<strong>Thụ động hoàn thành</strong>: has/have been + V3. <em>Translate into</em> (dịch sang) — giới từ cố định.", highlight: "has been translated into" },
  { vi: "Cầu này đang được xây dựng.", en: "The bridge is being built.", tip: "<strong>Thụ động tiếp diễn</strong>: is/are being + V3. Diễn tả hành động đang xảy ra ở thời điểm nói.", highlight: "is being built" },
  { vi: "Anh ấy được trao giải thưởng vì những đóng góp của mình.", en: "He was awarded the prize for his contributions.", tip: "<em>Be awarded + giải thưởng + for + lý do</em>. <em>Contributions</em> (đóng góp) thường dùng số nhiều.", highlight: "was awarded" },
  { vi: "Dự án đã bị hủy vào phút chót.", en: "The project was cancelled at the last minute.", tip: "<em>At the last minute</em> (vào phút chót) — idiom cố định. <em>Cancel</em>: 2 chữ l trong tiếng Anh Anh, 1 chữ l tiếng Anh Mỹ.", highlight: "cancelled at the last minute" },
  { vi: "Vấn đề này cần được giải quyết ngay lập tức.", en: "This issue needs to be addressed immediately.", tip: "<em>Address an issue</em> (giải quyết/xử lý vấn đề) — tự nhiên hơn <em>solve</em> trong văn viết chính thức.", highlight: "needs to be addressed" },

  // ── Nhóm 18: Idioms & Phrases ──
  { vi: "Anh ấy đã đặt cược vào dự án đó.", en: "He bet everything on that project.", tip: "<em>Bet on</em> (đặt cược vào). <em>Bet everything</em> = đặt tất cả vào, chấp nhận rủi ro hoàn toàn.", highlight: "bet everything on" },
  { vi: "Chúng ta hãy cùng nhau đối mặt với khó khăn.", en: "Let's face the challenge together.", tip: "<em>Face a challenge/problem</em> (đối mặt với thử thách). <em>Let's + V</em> (không có <em>to</em>) để đề nghị cùng làm.", highlight: "face the challenge" },
  { vi: "Tôi đã mất quá nhiều thời gian vào việc vô ích.", en: "I've been wasting too much time on pointless things.", tip: "<em>Waste time on</em> (lãng phí thời gian vào). <em>Pointless</em> (vô nghĩa, vô ích) mạnh hơn <em>useless</em>.", highlight: "wasting time on" },
  { vi: "Hãy suy nghĩ kỹ trước khi đưa ra quyết định.", en: "Think it through before making a decision.", tip: "<em>Think it through</em> (suy nghĩ thấu đáo) — phrasal verb quan trọng. Khác với <em>think about</em> (nghĩ về).", highlight: "Think it through" },
  { vi: "Chúng ta phải nhìn nhận vấn đề từ nhiều góc độ.", en: "We need to look at the problem from different angles.", tip: "<em>Look at from different angles</em> (nhìn từ nhiều góc độ) — cụm thường dùng trong thảo luận học thuật.", highlight: "from different angles" },

  // ── Nhóm 19: So sánh ──
  { vi: "Anh ấy không thông minh bằng người ta nghĩ.", en: "He is not as smart as people think.", tip: "<strong>As + tính từ + as</strong> (so sánh bằng). Câu phủ định: <em>not as... as</em> (không bằng).", highlight: "not as smart as" },
  { vi: "Càng học nhiều, bạn càng biết nhiều.", en: "The more you study, the more you know.", tip: "<strong>The + so sánh hơn, the + so sánh hơn</strong> — cấu trúc diễn tả quan hệ tỷ lệ thuận.", highlight: "The more... the more" },
  { vi: "Đây là bài thi khó nhất tôi từng làm.", en: "This is the hardest exam I have ever taken.", tip: "<strong>Superlative (khó nhất)</strong> + mệnh đề quan hệ với <em>ever</em>. <em>Take an exam</em> (làm bài thi).", highlight: "hardest exam I have ever taken" },
  { vi: "Tiếng Anh quan trọng hơn bạn nghĩ.", en: "English is more important than you think.", tip: "<em>More important than</em> (quan trọng hơn) — so sánh hơn của tính từ dài. Không dùng <em>importanter</em>.", highlight: "more important than you think" },
  { vi: "Cô ấy giỏi toán hơn tôi rất nhiều.", en: "She is much better at math than I am.", tip: "<em>Much better</em> (giỏi hơn nhiều) — <em>much</em> tăng cường so sánh hơn. <em>Good at</em> + môn học/kỹ năng.", highlight: "much better at math" },

  // ── Nhóm 20: Câu phức & Liên từ ──
  { vi: "Mặc dù trời mưa, chúng tôi vẫn đi picnic.", en: "Although it rained, we still went on a picnic.", tip: "<em>Although/Even though</em> (mặc dù) + mệnh đề. Không dùng <em>but</em> cùng với <em>although</em>.", highlight: "Although it rained, we still" },
  { vi: "Tôi học tiếng Anh để có thêm cơ hội việc làm.", en: "I learn English so that I can have more job opportunities.", tip: "<em>So that + S + can/could + V</em> (để mà/nhằm mục đích). Diễn tả mục đích cụ thể hơn <em>to + V</em>.", highlight: "so that I can have" },
  { vi: "Anh ấy không chỉ thông minh mà còn rất chăm chỉ.", en: "Not only is he smart, but he is also very hardworking.", tip: "<strong>Not only... but also</strong> — khi <em>Not only</em> đứng đầu câu, cần đảo ngữ: <em>Not only + trợ động từ + S + V</em>.", highlight: "Not only is he smart, but also" },
  { vi: "Cả hai cách tiếp cận đều có ưu và nhược điểm.", en: "Both approaches have their advantages and disadvantages.", tip: "<em>Both + N số nhiều + V số nhiều</em>. <em>Advantages and disadvantages</em> (ưu và nhược điểm) — cụm từ học thuật.", highlight: "Both approaches have their advantages" },
  { vi: "Thời tiết xấu, cho dù vậy chúng tôi vẫn thức dậy sớm.", en: "Despite the bad weather, we still woke up early.", tip: "<em>Despite + danh từ/cụm danh từ</em> (mặc dù). Khác với <em>although</em> (đi với mệnh đề chứa S + V).", highlight: "Despite the bad weather" },
];

// ── Reflex Module ──
class ReflexModule {
  constructor() {
    this.currentIndex = 0;
    this.score = 0;
    this.answered = false;
    this.sentences = [...REFLEX_SENTENCES];
  }

  open() {
    this.currentIndex = 0;
    this.score = 0;
    this.answered = false;
    document.getElementById('reflex-overlay').style.display = 'block';
    document.getElementById('reflex-main').style.display = 'flex';
    document.getElementById('reflex-finish').style.display = 'none';
    document.body.style.overflow = 'hidden';
    this._renderCard();
  }

  close() {
    document.getElementById('reflex-overlay').style.display = 'none';
    document.body.style.overflow = '';
  }

  restart() {
    this.currentIndex = 0;
    this.score = 0;
    this.answered = false;
    document.getElementById('reflex-main').style.display = 'flex';
    document.getElementById('reflex-finish').style.display = 'none';
    this._renderCard();
  }

  handleKey(e) {
    // Ctrl+Enter or Shift+Enter to check
    if ((e.ctrlKey || e.shiftKey) && e.key === 'Enter') {
      e.preventDefault();
      this.check();
    }
  }

  _renderCard() {
    const item = this.sentences[this.currentIndex];
    const total = this.sentences.length;

    // Update header
    document.getElementById('reflex-progress-text').textContent = `Câu ${this.currentIndex + 1} / ${total}`;
    document.getElementById('reflex-score-badge').textContent = `✓ ${this.score} đúng`;
    document.getElementById('reflex-progress-bar').style.width = `${((this.currentIndex + 1) / total) * 100}%`;

    // Update card content
    document.getElementById('reflex-card-num').textContent = `CÂU ${this.currentIndex + 1}`;
    document.getElementById('reflex-vi-text').textContent = item.vi;

    // Reset input
    const input = document.getElementById('reflex-user-input');
    input.value = '';
    input.disabled = false;
    input.classList.remove('reflex-correct', 'reflex-wrong');

    // Show input area, hide answer panel
    document.getElementById('reflex-input-area').style.display = 'flex';
    document.getElementById('reflex-answer-panel').style.display = 'none';

    this.answered = false;

    // Focus input
    setTimeout(() => input.focus(), 100);
  }

  check() {
    if (this.answered) return;

    const item = this.sentences[this.currentIndex];
    const userText = document.getElementById('reflex-user-input').value.trim();

    if (!userText) {
      this.showAnswer();
      return;
    }

    this.answered = true;

    // Flexible comparison: normalize punctuation, case, extra spaces
    const normalize = (s) => s.toLowerCase()
      .replace(/[.,!?;:'"]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const isCorrect = normalize(userText) === normalize(item.en);

    if (isCorrect) this.score++;

    // Show user answer box
    const userAnswerBox = document.getElementById('reflex-user-answer-box');
    userAnswerBox.style.display = 'block';
    const userAnswerText = document.getElementById('reflex-user-answer-text');
    userAnswerText.textContent = userText;
    userAnswerText.className = 'reflex-user-answer ' + (isCorrect ? 'reflex-correct' : 'reflex-wrong');

    // Show result badge
    const resultBadge = document.getElementById('reflex-result-badge');
    resultBadge.textContent = isCorrect ? '✅ Chính xác!' : '❌ Chưa đúng — xem đáp án bên dưới';
    resultBadge.className = 'reflex-result-badge ' + (isCorrect ? 'result-correct' : 'result-wrong');

    this._showAnswerPanel(item);
  }

  showAnswer() {
    if (this.answered) return;
    this.answered = true;

    const item = this.sentences[this.currentIndex];

    // Hide user answer box
    document.getElementById('reflex-user-answer-box').style.display = 'none';

    // Show result badge as hint
    const resultBadge = document.getElementById('reflex-result-badge');
    resultBadge.textContent = '👁 Xem đáp án';
    resultBadge.className = 'reflex-result-badge result-neutral';

    this._showAnswerPanel(item);
  }

  _showAnswerPanel(item) {
    // Render the correct English answer with highlight
    const enEl = document.getElementById('reflex-en-answer');
    let highlighted = item.en;
    if (item.highlight) {
      const escaped = item.highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      highlighted = item.en.replace(
        new RegExp(`(${escaped})`, 'gi'),
        '<span class="reflex-highlight">$1</span>'
      );
    }
    enEl.innerHTML = highlighted;

    // Grammar tip
    document.getElementById('reflex-grammar-tip').innerHTML = `💡 <strong>Giải thích:</strong> ${item.tip}`;

    // Update score badge
    document.getElementById('reflex-score-badge').textContent = `✓ ${this.score} đúng`;

    // Hide input, show answer panel
    document.getElementById('reflex-input-area').style.display = 'none';
    document.getElementById('reflex-answer-panel').style.display = 'flex';

    // Scroll to answer on mobile
    document.getElementById('reflex-answer-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  skip() {
    if (!this.answered) {
      this.answered = true;
    }
    this.next();
  }

  next() {
    if (this.currentIndex < this.sentences.length - 1) {
      this.currentIndex++;
      this.answered = false;
      this._renderCard();
      // Scroll to top of main
      document.getElementById('reflex-main').scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this._showFinish();
    }
  }

  _showFinish() {
    document.getElementById('reflex-main').style.display = 'none';
    document.getElementById('reflex-finish').style.display = 'block';
    document.getElementById('reflex-final-score').textContent = `${this.score} / ${this.sentences.length}`;
    document.getElementById('reflex-progress-bar').style.width = '100%';
  }
}

const reflex = new ReflexModule();
