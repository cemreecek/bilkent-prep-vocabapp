import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5) # 16:9 widescreen format

    # Bilkent Prep App Official Design System Palette (Light Mode Academic Theme)
    COLOR_BG = RGBColor(249, 249, 254)        # surface #f9f9fe
    COLOR_SURFACE = RGBColor(255, 255, 255)   # surface-container-lowest #ffffff
    COLOR_SURFACE_ALT = RGBColor(244, 243, 248)# surface-container-low #f4f3f8
    
    COLOR_NAVY_PRIMARY = RGBColor(0, 30, 64)   # primary #001e40 (Bilkent Navy)
    COLOR_NAVY_CONTAINER = RGBColor(0, 51, 102)# primary-container #003366
    COLOR_NAVY_ACCENT = RGBColor(58, 95, 148)  # surface-tint #3a5f94
    
    COLOR_AMBER_GOLD = RGBColor(254, 166, 25)  # secondary-container #fea619 (Streak Gold)
    COLOR_AMBER_TEXT = RGBColor(133, 83, 0)    # secondary #855300
    
    COLOR_ERROR_RED = RGBColor(186, 26, 26)    # error #ba1a1a (Error Debt Red)
    COLOR_ERROR_CONTAINER = RGBColor(255, 218, 214) # error-container #ffdad6 (Soft Red Card)
    COLOR_ERROR_TEXT = RGBColor(147, 0, 10)    # on-error-container #93000a
    
    COLOR_TEXT_DARK = RGBColor(26, 28, 31)     # on-surface #1a1c1f
    COLOR_MUTED = RGBColor(67, 71, 79)         # on-surface-variant #43474f
    COLOR_BORDER = RGBColor(195, 198, 209)     # outline-variant #c3c6d1

    blank_layout = prs.slide_layouts[6]

    def add_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_BG
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text="BILKENT PREP VOCAB APP"):
        # Header bar / top brand line
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(10), Inches(0.4))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(11)
        p_cat.font.bold = True
        p_cat.font.color.rgb = COLOR_NAVY_ACCENT

        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.5), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(28)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_NAVY_PRIMARY

    def add_card(slide, left, top, width, height, bg_color=COLOR_SURFACE, border_color=COLOR_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1)
        else:
            card.line.fill.background()
        return card

    # ==========================================
    # SLIDE 1: Title Slide (Bilkent Navy Brand Banner)
    # ==========================================
    slide1 = prs.slides.add_slide(blank_layout)
    add_bg(slide1)

    # Hero Banner in Bilkent Navy
    add_card(slide1, 0.8, 0.8, 11.733, 3.2, COLOR_NAVY_PRIMARY, None)

    tbox = slide1.shapes.add_textbox(Inches(1.2), Inches(1.1), Inches(10.933), Inches(2.6))
    tf = tbox.text_frame
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "BILKENT PREP VOCABULARY PLATFORM"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = COLOR_AMBER_GOLD
    p.space_after = Pt(8)

    p2 = tf.add_paragraph()
    p2.text = "Master Your Vocab, Conquer Your Prep Year!"
    p2.font.size = Pt(34)
    p2.font.bold = True
    p2.font.color.rgb = RGBColor(255, 255, 255)
    p2.space_after = Pt(12)

    p3 = tf.add_paragraph()
    p3.text = "An error-driven, curriculum-aligned platform engineered specifically for Bilkent Prep students."
    p3.font.size = Pt(16)
    p3.font.color.rgb = RGBColor(213, 227, 255)

    # Bottom 3 Highlight Cards matching Bilkent UI Bento Grid
    add_card(slide1, 0.8, 4.3, 3.7, 2.4, COLOR_SURFACE, COLOR_BORDER)
    tb1 = slide1.shapes.add_textbox(Inches(1.0), Inches(4.5), Inches(3.3), Inches(2.0))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    p = tf1.paragraphs[0]
    p.text = "🔥 3-Day Streak System"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = COLOR_AMBER_TEXT
    p2 = tf1.add_paragraph()
    p2.text = "Build automatic daily habits with 5-10 minute micro-learning sessions."
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_MUTED

    add_card(slide1, 4.8, 4.3, 3.7, 2.4, COLOR_ERROR_CONTAINER, COLOR_ERROR_RED)
    tb2 = slide1.shapes.add_textbox(Inches(5.0), Inches(4.5), Inches(3.3), Inches(2.0))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    p = tf2.paragraphs[0]
    p.text = "🎯 Clear Error Debt"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = COLOR_ERROR_TEXT
    p2 = tf2.add_paragraph()
    p2.text = "Turn every mistake into verified mastery before official prep exams."
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_ERROR_TEXT

    add_card(slide1, 8.8, 4.3, 3.7, 2.4, COLOR_SURFACE, COLOR_BORDER)
    tb3 = slide1.shapes.add_textbox(Inches(9.0), Inches(4.5), Inches(3.3), Inches(2.0))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    p = tf3.paragraphs[0]
    p.text = "📱 Mobile-First PWA"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = COLOR_NAVY_PRIMARY
    p2 = tf3.add_paragraph()
    p2.text = "Keep the app shortcut on your phone's home screen for practice anywhere."
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_MUTED


    # ==========================================
    # SLIDE 2: Why I Built This App
    # ==========================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_bg(slide2)
    add_header(slide2, "Why I Built This App For You")

    # Column 1: Traditional Problem
    add_card(slide2, 0.8, 1.8, 5.6, 5.2, COLOR_SURFACE, COLOR_BORDER)
    tb_p = slide2.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.0), Inches(4.7))
    tf_p = tb_p.text_frame
    tf_p.word_wrap = True

    p = tf_p.paragraphs[0]
    p.text = "❌ Traditional Vocab Cramming"
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = COLOR_ERROR_RED
    p.space_after = Pt(12)

    bullets_prob = [
        ("Generic Word Lists: ", "Popular apps use generic vocabulary that doesn't align with Bilkent Prep exam requirements."),
        ("Passive Memorization: ", "Flipping cards without context fails when writing essays or solving exam cloze tests."),
        ("Forgotten Mistakes: ", "In regular quizzes, once you make a mistake, it gets graded and forgotten—leaving hidden gaps."),
        ("Last-Minute Stress: ", "Cramming 100 words the night before an exam results in rapid memory decay within 48 hours.")
    ]
    for b_title, b_desc in bullets_prob:
        p = tf_p.add_paragraph()
        p.space_after = Pt(10)
        r1 = p.add_run()
        r1.text = "• " + b_title
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = COLOR_TEXT_DARK
        r2 = p.add_run()
        r2.text = b_desc
        r2.font.size = Pt(12)
        r2.font.color.rgb = COLOR_MUTED

    # Column 2: Bilkent Advantage
    add_card(slide2, 6.8, 1.8, 5.7, 5.2, COLOR_SURFACE, COLOR_NAVY_PRIMARY)
    tb_s = slide2.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.1), Inches(4.7))
    tf_s = tb_s.text_frame
    tf_s.word_wrap = True

    p = tf_s.paragraphs[0]
    p.text = "✨ The Bilkent App Advantage"
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY_PRIMARY
    p.space_after = Pt(12)

    bullets_sol = [
        ("100% Curriculum Aligned: ", "Exact target words organized by Bilkent Prep levels (Elementary, Inter, Pre-Fac, Upper, PIN)."),
        ("Active Recall & Context: ", "Cloze sentences, collocations, and paraphrasing test true production skills."),
        ("Error-Driven Mastery: ", "Mistakes enter your Error Debt queue and keep repeating until proven mastered."),
        ("Smart Spaced Repetition: ", "Automated SM-2 algorithm reviews words right before your brain forgets them.")
    ]
    for b_title, b_desc in bullets_sol:
        p = tf_s.add_paragraph()
        p.space_after = Pt(10)
        r1 = p.add_run()
        r1.text = "• " + b_title
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = COLOR_TEXT_DARK
        r2 = p.add_run()
        r2.text = b_desc
        r2.font.size = Pt(12)
        r2.font.color.rgb = COLOR_MUTED


    # ==========================================
    # SLIDE 3: Better Vocab Studying Habit
    # ==========================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_bg(slide3)
    add_header(slide3, "How This Builds a Powerful Studying Habit")

    cards_habit = [
        ("🔥 1. Daily Streak System", "Consistency Beats Cramming", "Practicing 5-10 minutes daily builds neural connections faster than marathon cramming. The app tracks your streak to keep you in the top 10% of students!"),
        ("🧠 2. Spaced Repetition (SM-2)", "Scientific Memory Retention", "Instead of reviewing words randomly, our algorithm schedules reviews at optimal intervals (1 day, 3 days, 7 days) right before memory decay occurs."),
        ("📝 3. Personal Vocab Journal", "Ownership & Context", "Add words you encounter in class or books into your personal journal. Write your own definitions, collocations, and sentences to anchor word meanings deeply.")
    ]

    for idx, (title, subtitle, body) in enumerate(cards_habit):
        left = 0.8 + idx * 4.0
        add_card(slide3, left, 1.8, 3.7, 5.2, COLOR_SURFACE, COLOR_BORDER)
        tb = slide3.shapes.add_textbox(Inches(left + 0.2), Inches(2.0), Inches(3.3), Inches(4.7))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = COLOR_NAVY_PRIMARY
        p.space_after = Pt(4)

        p_sub = tf.add_paragraph()
        p_sub.text = subtitle
        p_sub.font.size = Pt(12)
        p_sub.font.bold = True
        p_sub.font.color.rgb = COLOR_AMBER_TEXT
        p_sub.space_after = Pt(14)

        p_body = tf.add_paragraph()
        p_body.text = body
        p_body.font.size = Pt(13)
        p_body.font.color.rgb = COLOR_MUTED


    # ==========================================
    # SLIDE 4: The Error Debt Rationale
    # ==========================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_bg(slide4)
    add_header(slide4, "The 'Error Debt' Rationale: Turn Weaknesses Into Strengths")

    # Left: Error Debt Card styled after Bilkent Error Score Widget
    add_card(slide4, 0.8, 1.8, 6.5, 5.2, COLOR_ERROR_CONTAINER, COLOR_ERROR_RED)
    tb_e = slide4.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.9), Inches(4.7))
    tf_e = tb_e.text_frame
    tf_e.word_wrap = True

    p = tf_e.paragraphs[0]
    p.text = "🎯 What is Error Debt?"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = COLOR_ERROR_TEXT
    p.space_after = Pt(10)

    p2 = tf_e.add_paragraph()
    p2.text = "When you answer a question incorrectly, it isn't just marked wrong—it becomes 'Error Debt' (an Error Score added to your account)."
    p2.font.size = Pt(13)
    p2.font.color.rgb = COLOR_ERROR_TEXT
    p2.space_after = Pt(14)

    p3 = tf_e.add_paragraph()
    p3.text = "Why is this better than traditional quizzes?"
    p3.font.size = Pt(15)
    p3.font.bold = True
    p3.font.color.rgb = COLOR_NAVY_PRIMARY
    p3.space_after = Pt(8)

    ed_points = [
        ("No Loose Ends: ", "Mistakes are never swept under the rug. They accumulate in your Error Queue."),
        ("Required Repayment: ", "The ONLY way to lower your Error Debt is by correctly answering those missed words in Review Mode."),
        ("Zero Error Debt = Exam Ready: ", "When your Error Debt reaches 0, you have verified mastery over 100% of your weak words!")
    ]
    for b_title, b_desc in ed_points:
        p = tf_e.add_paragraph()
        p.space_after = Pt(8)
        r1 = p.add_run()
        r1.text = "• " + b_title
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = COLOR_TEXT_DARK
        r2 = p.add_run()
        r2.text = b_desc
        r2.font.size = Pt(12)
        r2.font.color.rgb = COLOR_MUTED

    # Right: Workflow Steps
    steps = [
        ("1. Practice Session", "Answer questions across cloze & word bank sets.", COLOR_NAVY_PRIMARY),
        ("2. Make a Mistake", "Word moves to your Error Queue (+1 Error Debt).", COLOR_ERROR_RED),
        ("3. Enter Review Mode", "App re-tests your specific missed words.", COLOR_AMBER_TEXT),
        ("4. Clear Debt!", "Correct answers clear debt and prove true mastery.", RGBColor(16, 185, 129))
    ]
    for idx, (stitle, sdesc, scolor) in enumerate(steps):
        top = 1.8 + idx * 1.3
        add_card(slide4, 7.6, top, 4.9, 1.15, COLOR_SURFACE, COLOR_BORDER)
        tb_step = slide4.shapes.add_textbox(Inches(7.8), Inches(top + 0.1), Inches(4.5), Inches(0.9))
        tf_s = tb_step.text_frame
        tf_s.word_wrap = True

        p = tf_s.paragraphs[0]
        p.text = stitle
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = scolor
        p.space_after = Pt(2)

        p2 = tf_s.add_paragraph()
        p2.text = sdesc
        p2.font.size = Pt(11)
        p2.font.color.rgb = COLOR_MUTED


    # ==========================================
    # SLIDE 5: Informing About Performance
    # ==========================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_bg(slide5)
    add_header(slide5, "Tracking Your Performance & Progress")

    # Card 1: Student Dashboard
    add_card(slide5, 0.8, 1.8, 5.6, 5.2, COLOR_SURFACE, COLOR_BORDER)
    tb_db = slide5.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.0), Inches(4.7))
    tf_db = tb_db.text_frame
    tf_db.word_wrap = True

    p = tf_db.paragraphs[0]
    p.text = "📊 Your Student Dashboard"
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY_PRIMARY
    p.space_after = Pt(12)

    dash_items = [
        ("Streak Counter: ", "See your active consecutive study days and keep your streak fire burning."),
        ("Error Debt Meter: ", "Watch your error balance drop as you complete dedicated review sessions."),
        ("Words Mastered: ", "Track total vocabulary items permanently stored in long-term memory."),
        ("Level Lock Progress: ", "Unlock higher prep levels (Elementary → Inter → Pre-Fac → Upper → PIN).")
    ]
    for b_t, b_d in dash_items:
        p = tf_db.add_paragraph()
        p.space_after = Pt(10)
        r1 = p.add_run()
        r1.text = "• " + b_t
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = COLOR_TEXT_DARK
        r2 = p.add_run()
        r2.text = b_d
        r2.font.size = Pt(12)
        r2.font.color.rgb = COLOR_MUTED

    # Card 2: Instructor Analytics
    add_card(slide5, 6.8, 1.8, 5.7, 5.2, COLOR_SURFACE, COLOR_BORDER)
    tb_t = slide5.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.1), Inches(4.7))
    tf_t = tb_t.text_frame
    tf_t.word_wrap = True

    p = tf_t.paragraphs[0]
    p.text = "👩‍🏫 Instructor Insights & Support"
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY_PRIMARY
    p.space_after = Pt(12)

    teacher_items = [
        ("Real-Time Class Insights: ", "Instructors see class-wide average streaks and engagement trends."),
        ("Identify Difficult Words: ", "We see which vocabulary words cause the highest Error Debt across sections."),
        ("Targeted In-Class Review: ", "We adapt classroom lectures to focus on the exact words students struggle with."),
        ("Fair & Transparent Tracking: ", "Your dedicated effort and study time are directly recognized.")
    ]
    for b_t, b_d in teacher_items:
        p = tf_t.add_paragraph()
        p.space_after = Pt(10)
        r1 = p.add_run()
        r1.text = "• " + b_t
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = COLOR_TEXT_DARK
        r2 = p.add_run()
        r2.text = b_d
        r2.font.size = Pt(12)
        r2.font.color.rgb = COLOR_MUTED


    # ==========================================
    # SLIDE 6: Signing In & Mobile App Setup
    # ==========================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_bg(slide6)
    add_header(slide6, "Signing In & Mobile App Setup")

    # Left: Sign in
    add_card(slide6, 0.8, 1.8, 5.6, 5.2, COLOR_SURFACE, COLOR_BORDER)
    tb_in = slide6.shapes.add_textbox(Inches(1.1), Inches(2.0), Inches(5.0), Inches(4.7))
    tf_in = tb_in.text_frame
    tf_in.word_wrap = True

    p = tf_in.paragraphs[0]
    p.text = "🔐 Step 1: Sign In With Bilkent Mail"
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY_PRIMARY
    p.space_after = Pt(14)

    steps_in = [
        ("1. Official Student Email: ", "You MUST sign in using your official institutional email address: @ug.bilkent.edu.tr."),
        ("2. Automatic Level Matching: ", "Signing in instantly links your profile to your assigned Bilkent Prep classroom section."),
        ("3. Seamless Authentication: ", "No complex passwords needed—secure single click authentication.")
    ]
    for b_t, b_d in steps_in:
        p = tf_in.add_paragraph()
        p.space_after = Pt(12)
        r1 = p.add_run()
        r1.text = b_t
        r1.font.bold = True
        r1.font.size = Pt(13)
        r1.font.color.rgb = COLOR_TEXT_DARK
        r2 = p.add_run()
        r2.text = b_d
        r2.font.size = Pt(12)
        r2.font.color.rgb = COLOR_MUTED

    # Right: Add to phone
    add_card(slide6, 6.8, 1.8, 5.7, 5.2, COLOR_SURFACE, COLOR_NAVY_PRIMARY)
    tb_pwa = slide6.shapes.add_textbox(Inches(7.1), Inches(2.0), Inches(5.1), Inches(4.7))
    tf_pwa = tb_pwa.text_frame
    tf_pwa.word_wrap = True

    p = tf_pwa.paragraphs[0]
    p.text = "📱 Step 2: Add to Phone Home Screen"
    p.font.size = Pt(19)
    p.font.bold = True
    p.font.color.rgb = COLOR_NAVY_PRIMARY
    p.space_after = Pt(14)

    p = tf_pwa.add_paragraph()
    p.text = "🍎 iPhone / iOS (Safari):"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_NAVY_ACCENT
    p2 = tf_pwa.add_paragraph()
    p2.text = "Open app link in Safari ➔ Tap 'Share' icon (bottom bar) ➔ Scroll & tap 'Add to Home Screen'."
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_MUTED
    p2.space_after = Pt(12)

    p = tf_pwa.add_paragraph()
    p.text = "🤖 Android (Chrome):"
    p.font.bold = True
    p.font.size = Pt(13)
    p.font.color.rgb = COLOR_NAVY_ACCENT
    p2 = tf_pwa.add_paragraph()
    p2.text = "Open app link in Chrome ➔ Tap 3 dots (top right) ➔ Tap 'Add to Home screen' or 'Install App'."
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_MUTED
    p2.space_after = Pt(12)

    p = tf_pwa.add_paragraph()
    p.text = "💡 Pro Tip:"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = COLOR_AMBER_TEXT
    p2 = tf_pwa.add_paragraph()
    p2.text = "Place the app icon directly on your phone's main dock next to your daily social apps so you never miss a day!"
    p2.font.size = Pt(12)
    p2.font.color.rgb = COLOR_TEXT_DARK


    # ==========================================
    # SLIDE 7: Summary & Call to Action
    # ==========================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_bg(slide7)

    add_card(slide7, 1.5, 1.2, 10.333, 5.2, COLOR_NAVY_PRIMARY, None)

    tb_end = slide7.shapes.add_textbox(Inches(2.0), Inches(1.5), Inches(9.333), Inches(4.5))
    tf_end = tb_end.text_frame
    tf_end.word_wrap = True

    p = tf_end.paragraphs[0]
    p.text = "READY TO CONQUER PREP VOCABULARY?"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = COLOR_AMBER_GOLD
    p.alignment = PP_ALIGN.CENTER
    p.space_after = Pt(10)

    p2 = tf_end.add_paragraph()
    p2.text = "Your Day 1 Challenge Starts Now!"
    p2.font.size = Pt(32)
    p2.font.bold = True
    p2.font.color.rgb = RGBColor(255, 255, 255)
    p2.alignment = PP_ALIGN.CENTER
    p2.space_after = Pt(25)

    steps_cta = [
        "1. Open the app link on your phone right now.",
        "2. Sign in with your @ug.bilkent.edu.tr email.",
        "3. Add the shortcut to your Home Screen.",
        "4. Complete your first 5-minute set & start your Day 1 Streak!"
    ]
    for s in steps_cta:
        p = tf_end.add_paragraph()
        p.text = s
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = RGBColor(213, 227, 255)
        p.alignment = PP_ALIGN.CENTER
        p.space_after = Pt(8)

    output_path = os.path.join(os.getcwd(), "Bilkent_Prep_Student_Intro.pptx")
    prs.save(output_path)
    print(f"Successfully generated Bilkent Prep Design System PowerPoint presentation at: {output_path}")

if __name__ == "__main__":
    create_presentation()
