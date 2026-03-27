from django import forms
from .models import Comments, Directions, Roles, Startups, StartupStages, Users, ChatConversations, TransactionTypes, UserVotes, SupportTicket, Franchises, Agencies, Specialists
from .utils import get_planet_urls


def convert_newlines_to_html(text):
    """Преобразует переносы строк в HTML-теги <br>"""
    if not text:
        return text
    
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    text = text.replace('\n', '<br>')
    
    return text


def convert_html_to_newlines(text):
    """Преобразует HTML-теги <br> обратно в переносы строк для отображения в textarea"""
    if not text:
        return text
    
    import re
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    
    return text


# ============================================================
# Base Entity Forms — shared across startups, franchises, agencies, specialists
# ============================================================

# Shared direction translation dict used by all entity forms
DIRECTION_TRANSLATIONS = {
    "Technology": "Технологии",
    "Healthcare": "Здоровье",
    "Finance": "Финансы",
    "Education": "Образование",
    "Entertainment": "Развлечения",
    "Fashion": "Мода",
    "Food": "Еда",
    "Gaming": "Игры",
    "Real Estate": "Недвижимость",
    "Travel": "Путешествия",
    "Agriculture": "Сельское хозяйство",
    "Energy": "Энергетика",
    "Environment": "Экология",
    "Social": "Социальные проекты",
    "Medicine": "Здоровье",
    "Auto": "Авто",
    "Delivery": "Доставка",
    "Cafe": "Кафе/рестораны",
    "Fastfood": "Фастфуд",
    "Health": "Здоровье",
    "Beauty": "Красота",
    "Transport": "Транспорт",
    "Sport": "Спорт",
    "Psychology": "Психология",
    "AI": "ИИ",
    "IT": "ИТ",
    "Retail": "Ритейл",
    "Брендинг": "Брендинг",
    "Видео и мультимедиа": "Видео и мультимедиа",
    "Перевод": "Перевод",
}


class BaseEntityFormMixin:
    """
    Mixin with shared fields and methods for all entity create forms.
    Provides: logo, creatives, proofs, video, catalog_card_image,
    short_description, terms, planet_image, agree_rules, agree_data_processing.

    Subclasses must define their own Meta class with model and fields.
    """

    # --- Shared field declarations (override in subclass if needed) ---
    logo = forms.ImageField(label="Логотип *", required=True)
    creatives = forms.FileField(
        required=False,  # Validated via request.FILES.getlist in view
        help_text="Загрузите изображения (до 10 файлов: PNG, JPEG)"
    )
    proofs = forms.FileField(
        required=False,
        help_text="Загрузите документы (до 10 файлов: PDF, DOC, TXT)"
    )
    video = forms.FileField(required=False, help_text="Загрузите видео (MP4, MOV)")
    catalog_card_image = forms.ImageField(
        label="Изображение для карточки в каталоге",
        required=False,
        help_text="Загрузите широкоформатное изображение (1200×400, PNG/JPEG/WEBP, макс. 5MB)"
    )
    short_description = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 3}), label="*Короткое описание", required=True
    )
    terms = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 5}), label="Условия", required=False
    )
    planet_image = forms.ChoiceField(
        choices=[], label="Выберите планету", required=False,
        widget=forms.HiddenInput(attrs={"id": "id_planet_image"})
    )
    agree_rules = forms.BooleanField(label="Согласен с правилами *", required=True)
    agree_data_processing = forms.BooleanField(label="Согласен с обработкой данных *", required=True)

    def init_planet_choices(self):
        """Initialize planet_image choices. Call from __init__."""
        try:
            planet_urls = get_planet_urls()
            self.fields["planet_image"].choices = [(p, p) for p in planet_urls]
            # Preserve current planet if editing
            if hasattr(self, 'instance') and self.instance and hasattr(self.instance, 'planet_image'):
                current = self.instance.planet_image
                if current and current not in planet_urls:
                    self.fields["planet_image"].choices = [(current, current)] + self.fields["planet_image"].choices
        except Exception as e:
            print(f"Error fetching planet URLs: {e}")
            self.fields["planet_image"].choices = []

    def clean_description(self):
        """Allow HTML tags in description (Quill editor generates HTML)."""
        return self.cleaned_data.get('description', '')

    def clean_files(self, cleaned_data):
        """Normalize file fields (flatten nested lists). Call from clean()."""
        for field_name in ('creatives', 'proofs', 'video'):
            files = cleaned_data.get(field_name, [])
            if isinstance(files, list) and all(isinstance(item, list) for item in files):
                files = [f for sublist in files for f in sublist]
            elif files and not isinstance(files, list):
                files = [files]
            else:
                files = files if files else []
            cleaned_data[field_name] = files
        return cleaned_data


class BaseEntityEditFormMixin(BaseEntityFormMixin):
    """
    Mixin for entity edit forms. Same as create but logo not required,
    file inputs use ClearableFileInput.
    """
    logo = forms.ImageField(
        label="Логотип", required=False,
        help_text="Загрузите новый логотип (изображение)"
    )
    creatives = forms.FileField(
        required=False, help_text="Загрузите новые изображения (до 10 файлов: PNG, JPEG)",
        widget=forms.ClearableFileInput(attrs={'accept': 'image/*'})
    )
    proofs = forms.FileField(
        required=False, help_text="Загрузите новые документы (до 15 файлов: PDF, DOC, TXT)",
        widget=forms.ClearableFileInput(attrs={'accept': '.pdf,.doc,.docx,.txt'})
    )
    video = forms.FileField(
        required=False, help_text="Загрузите новое видео (MP4, MOV)",
        widget=forms.ClearableFileInput(attrs={'accept': 'video/*'})
    )
    catalog_card_image = forms.ImageField(
        label="Изображение для карточки в каталоге", required=False,
        help_text="Загрузите широкоформатное изображение (1200×400, PNG/JPEG/WEBP, макс. 5MB)",
        widget=forms.ClearableFileInput(attrs={'accept': 'image/*'})
    )


class RegisterForm(forms.ModelForm):
    hp_field = forms.CharField(required=False, label="", widget=forms.TextInput(attrs={
        "autocomplete": "off",
        "tabindex": "-1",
    }))
    captcha_answer = forms.CharField(required=False, label="Ответ на капчу")
    password = forms.CharField(widget=forms.PasswordInput, label="Пароль")
    confirm_password = forms.CharField(
        widget=forms.PasswordInput, label="Подтвердите пароль"
    )
    class Meta:
        model = Users
        fields = ["email", "first_name", "last_name", "phone"]
        labels = {
            "email": "Email",
            "first_name": "Имя",
            "last_name": "Фамилия",
            "phone": "Телефон",
        }
    def clean_email(self):
        email = self.cleaned_data.get("email")
        if email and Users.objects.filter(email=email).exists():
            raise forms.ValidationError("Этот email уже используется.")
        return email
    def clean(self):
        cleaned_data = super().clean()
        hp_value = cleaned_data.get("hp_field")
        if hp_value:
            raise forms.ValidationError("Обнаружена подозрительная активность.")
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")
        if password != confirm_password:
            raise forms.ValidationError("Пароли не совпадают")
        return cleaned_data
class LoginForm(forms.Form):
    hp_field = forms.CharField(required=False, label="", widget=forms.TextInput(attrs={
        "autocomplete": "off",
        "tabindex": "-1",
    }))
    captcha_answer = forms.CharField(required=False, label="Ответ на капчу")
    email = forms.EmailField(label="Электронная почта")
    password = forms.CharField(widget=forms.PasswordInput, label="Пароль")

    def clean(self):
        cleaned_data = super().clean()
        hp_value = cleaned_data.get("hp_field")
        if hp_value:
            raise forms.ValidationError("Обнаружена подозрительная активность.")
        return cleaned_data

class StartupEditForm(BaseEntityEditFormMixin, forms.ModelForm):
    # --- Startup-specific edit fields ---
    direction = forms.ModelChoiceField(
        queryset=Directions.objects.none(), label="Направление *", required=True
    )
    stage = forms.ModelChoiceField(
        queryset=StartupStages.objects.all(), label="Стадия", required=False, empty_label="Выберите стадию"
    )
    micro_investment_available = forms.BooleanField(
        required=False, label="Микроинвестиции доступны"
    )
    INVESTMENT_TYPE_CHOICES = [
        ("", "Выберите тип"),
        ("invest", "Инвестирование"),
        ("buy", "Выкуп"),
        ("both", "Инвестирование + Выкуп"),
    ]
    investment_type = forms.ChoiceField(
        choices=INVESTMENT_TYPE_CHOICES, label="Тип инвестирования",
        required=False, widget=forms.Select(attrs={"class": "form-control"}),
    )
    funding_goal = forms.IntegerField(
        label="Цель финансирования *", required=True,
        widget=forms.NumberInput(attrs={"class": "form-control", "placeholder": "Введите сумму ₽"}),
    )
    pitch_deck_url = forms.URLField(
        label="Ссылка на презентацию", required=False,
        widget=forms.URLInput(attrs={"class": "form-control", "placeholder": "URL"}),
    )
    valuation = forms.IntegerField(
        label="Оценка", required=False,
        widget=forms.NumberInput(attrs={"class": "form-control", "placeholder": "1"}),
    )
    amount_raised = forms.IntegerField(
        label="Собранная сумма (₽)", required=False,
        widget=forms.NumberInput(attrs={"class": "form-control", "placeholder": "Введите сумму"}),
    )

    class Meta:
        model = Startups
        fields = [
            "title",
            "short_description",
            "description",
            "logo",
            "creatives",
            "proofs",
            "video",
            "direction",
            "stage",
            "micro_investment_available",
            "investment_type",
            "planet_image",
            "pitch_deck_url",
            "valuation",
            "amount_raised",
            "funding_goal",
            "terms",
            "catalog_card_image",
            "contact_website",
            "contact_telegram",
            "contact_whatsapp",
        ]
        labels = {
            "title": "Название",
            "contact_website": "Сайт",
            "contact_telegram": "Telegram",
            "contact_whatsapp": "WhatsApp",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.init_planet_choices()

        # Same direction setup as StartupForm
        extra_old = []
        if getattr(self, 'instance', None) and getattr(self.instance, 'direction', None):
            current_dir = getattr(self.instance.direction, 'direction_name', None)
            if current_dir in ['Healthcare', 'Medicine']:
                extra_old = ['Healthcare', 'Medicine']
        self.fields["direction"].queryset = Directions.objects.filter(
            direction_name__in=StartupForm.ALLOWED_DIRECTIONS + extra_old
        ).order_by("direction_name")
        self.fields["direction"].label_from_instance = lambda obj: DIRECTION_TRANSLATIONS.get(
            getattr(obj, "direction_name", str(obj)),
            getattr(obj, "direction_name", str(obj))
        )

class StartupForm(BaseEntityFormMixin, forms.ModelForm):
    # --- Startup-specific fields ---
    direction = forms.ModelChoiceField(
        queryset=Directions.objects.none(), label="Направление *", required=True
    )
    stage = forms.ModelChoiceField(
        queryset=StartupStages.objects.all(), label="Стадия", required=False, empty_label="Выберите стадию"
    )
    micro_investment_available = forms.BooleanField(
        required=False, label="Микроинвестиции доступны"
    )
    INVESTMENT_TYPE_CHOICES = [
        ("", "Выберите тип"),
        ("invest", "Инвестирование"),
        ("buy", "Выкуп"),
        ("both", "Инвестирование + Выкуп"),
    ]
    investment_type = forms.ChoiceField(
        choices=INVESTMENT_TYPE_CHOICES, label="Тип инвестирования",
        required=False, widget=forms.Select(attrs={"class": "form-control"}),
    )

    ALLOWED_DIRECTIONS = [
        'Technology', 'Finance', 'Education', 'Entertainment',
        'Fashion', 'Food', 'Gaming', 'Real Estate', 'Travel', 'Agriculture',
        'Energy', 'Environment', 'Social', 'Auto', 'Delivery',
        'Cafe', 'Fastfood', 'Health', 'Beauty', 'Transport', 'Sport',
        'Psychology', 'AI', 'IT', 'Retail'
    ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.init_planet_choices()

        # Startup direction setup
        extra_old = []
        if getattr(self, 'instance', None) and getattr(self.instance, 'direction', None):
            current_dir = getattr(self.instance.direction, 'direction_name', None)
            if current_dir in ['Healthcare', 'Medicine']:
                extra_old = ['Healthcare', 'Medicine']
        self.fields["direction"].queryset = Directions.objects.filter(
            direction_name__in=self.ALLOWED_DIRECTIONS + extra_old
        ).order_by("direction_name")
        self.fields["direction"].label_from_instance = lambda obj: DIRECTION_TRANSLATIONS.get(
            getattr(obj, "direction_name", str(obj)),
            getattr(obj, "direction_name", str(obj))
        )
    class Meta:
        model = Startups
        fields = [
            "title",
            "short_description",
            "description",
            "terms",
            "funding_goal",
            "amount_raised",
            "valuation",
            "pitch_deck_url",
            "logo",
            "direction",
            "stage",
            "investment_type",
            "agree_rules",
            "agree_data_processing",
            "micro_investment_available",
            "creatives",
            "proofs",
            "video",
            "planet_image",
            "catalog_card_image",
        ]
        widgets = {
            "title": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "Ромашка"}
            ),
            "short_description": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 3,
                    "placeholder": "Краткое описание стартапа",
                }
            ),
            "description": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 5,
                    "placeholder": "Подробное описание стартапа",
                }
            ),
            "terms": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 5,
                    "placeholder": "Условия сотрудничества",
                }
            ),
            "funding_goal": forms.NumberInput(
                attrs={"class": "form-control", "placeholder": "Введите сумму ₽"}
            ),
            "amount_raised": forms.NumberInput(
                attrs={"class": "form-control", "placeholder": "Введите сумму"}
            ),
            "valuation": forms.NumberInput(
                attrs={"class": "form-control", "placeholder": "1"}
            ),
            "pitch_deck_url": forms.URLInput(
                attrs={"class": "form-control", "placeholder": "https://example.com"}
            ),
            "direction": forms.Select(attrs={"class": "form-control"}),
            "stage": forms.Select(attrs={"class": "form-control"}),
            "logo": forms.FileInput(attrs={"class": "form-control-file"}),
        }
        labels = {
            "title": "Название стартапа *",
            "short_description": "*Короткое описание",
            "description": "*Полное описание",
            "terms": "Условия",
            "funding_goal": "Цель финансирования (₽) *",
            "amount_raised": "Собранная сумма (₽)",
            "valuation": "Оценка (₽)",
            "pitch_deck_url": "Ссылка на презентацию",
            "investment_type": "Тип инвестирования *",
            "direction": "Направление *",
            "stage": "Стадия *",
            "logo": "Логотип *",
            "creatives": "Изображения *",
            "video": "Видео",
            "proofs": "Документы",
            "micro_investment_available": "Микроинвестиции доступны",
            "agree_rules": "Согласен с правилами *",
            "agree_data_processing": "Согласен с обработкой данных *",
        }
    def clean_title(self):
        title = self.cleaned_data.get("title")
        qs = Startups.objects.filter(title__iexact=title)
        if self.instance and self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise forms.ValidationError("Стартап с таким названием уже существует.")
        return title

    def clean(self):
        cleaned_data = super().clean()
        cleaned_data = self.clean_files(cleaned_data)
        # Startup validates creatives in clean() (legacy); franchise does it in view
        if len(cleaned_data.get("creatives", [])) > 10:
            self.add_error("creatives", "Можно прикрепить не более 10 изображений.")
        if len(cleaned_data.get("proofs", [])) > 10:
            self.add_error("proofs", "Можно прикрепить не более 10 документов.")
        if len(cleaned_data.get("video", [])) > 3:
            self.add_error("video", "Можно прикрепить не более 3 видео.")
        return cleaned_data

class DirectionModelChoiceField(forms.ModelChoiceField):
    def label_from_instance(self, obj):
        translations = {
            "Beauty": "Красота",
            "Cafe": "Кафе/рестораны",
            "Delivery": "Доставка",
            "Fastfood": "Фастфуд",
            "Finance": "Финансы",
            "Healthcare": "Здравоохранение",
            "Sport": "Спорт",
            "Technology": "Технологии",
        }
        return translations.get(getattr(obj, "direction_name", str(obj)), getattr(obj, "direction_name", str(obj)))

class FranchiseForm(BaseEntityFormMixin, forms.ModelForm):
    # --- Franchise-specific fields ---
    direction = DirectionModelChoiceField(
        queryset=Directions.objects.filter(
            direction_name__in=["Beauty", "Cafe", "Delivery", "Fastfood", "Finance", "Healthcare", "Sport", "Technology"]
        ).order_by("direction_name"),
        label="Категория *", required=True,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.init_planet_choices()

    class Meta:
        model = Franchises
        fields = [
            "title",
            "short_description",
            "description",
            "terms",
            "investment_size",
            "franchise_cost",
            "pitch_deck_url",
            "logo",
            "direction",

            "agree_rules",
            "agree_data_processing",
            "creatives",
            "proofs",
            "video",
            "planet_image",
            "catalog_card_image",
            "profit_calculation",
            "contact_website",
            "contact_telegram",
            "contact_whatsapp",
        ]
        widgets = {
            "title": forms.TextInput(attrs={"class": "form-control", "placeholder": "Название франшизы"}),
            "short_description": forms.Textarea(attrs={"class": "form-control", "rows": 3, "placeholder": "Краткое описание франшизы"}),
            "description": forms.Textarea(attrs={"class": "form-control", "rows": 5, "placeholder": "Подробное описание франшизы"}),
            "terms": forms.Textarea(attrs={"class": "form-control", "rows": 5, "placeholder": "Условия сотрудничества"}),
            "investment_size": forms.NumberInput(attrs={"class": "form-control", "placeholder": "Введите сумму ₽"}),
            "franchise_cost": forms.NumberInput(attrs={"class": "form-control", "placeholder": "Паушальный взнос ₽"}),

            "pitch_deck_url": forms.URLInput(attrs={"class": "form-control", "placeholder": "https://example.com"}),
            "direction": forms.Select(attrs={"class": "form-control"}),
            "logo": forms.FileInput(attrs={"class": "form-control-file"}),
            "profit_calculation": forms.Textarea(attrs={"class": "form-control", "rows": 5, "placeholder": "Описание расчета прибыли"}),
        }
        labels = {
            "title": "Название франшизы *",
            "short_description": "*Короткое описание",
            "description": "*Полное описание",
            "terms": "Условия",
            "investment_size": "Размер инвестиций (₽)",
            "franchise_cost": "Паушальный взнос (₽)",
            "pitch_deck_url": "Ссылка на презентацию",
            "direction": "Категория *",
            "stage": "Стадия *",
            "logo": "Логотип *",
            "creatives": "Изображения *",
            "video": "Видео",
            "proofs": "Документы",
            "agree_rules": "Согласен с правилами *",
            "agree_data_processing": "Согласен с обработкой данных *",
            "profit_calculation": "Стоимость и расчет прибыли",
        }

    def clean(self):
        cleaned_data = super().clean()
        return self.clean_files(cleaned_data)

class AgencyForm(BaseEntityFormMixin, forms.ModelForm):
    # --- Agency-specific fields ---
    agency_category = forms.ChoiceField(
        choices=[
            ("", "Выберите категорию"),
            ("Веб-разработка", "Веб-разработка"),
            ("Мобильная разработка", "Мобильная разработка"),
            ("Дизайн", "Дизайн"),
            ("Маркетинг", "Маркетинг"),
            ("ИИ", "ИИ"),
            ("Брендинг", "Брендинг"),
            ("Видео и мультимедиа", "Видео и мультимедиа"),
            ("Перевод", "Перевод"),
        ],
        label="Категория", required=False
    )
    agency_services = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 5}), label="Услуги", required=False
    )
    terms = forms.CharField(widget=forms.Textarea(attrs={"rows": 5}), label="Этапы работ", required=False)
    successful_projects = forms.IntegerField(
        label="Успешных проектов", required=False,
        help_text="Количество успешно реализованных проектов"
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.init_planet_choices()

    class Meta:
        model = Agencies
        fields = [
            "title",
            "short_description",
            "description",
            "terms",
            "pitch_deck_url",
            "logo",

            "agree_rules",
            "agree_data_processing",
            "creatives",
            "proofs",
            "video",
            "planet_image",
            "catalog_card_image",
            "successful_projects",
            "contact_website",
            "contact_telegram",
            "contact_whatsapp",
        ]
        widgets = {
            "title": forms.TextInput(attrs={"class": "form-control", "placeholder": "Название агентства"}),
            "short_description": forms.Textarea(attrs={"class": "form-control", "rows": 3, "placeholder": "Краткое описание агентства"}),
            "description": forms.Textarea(attrs={"class": "form-control", "rows": 5, "placeholder": "Подробное описание агентства"}),
            "terms": forms.Textarea(attrs={"class": "form-control", "rows": 5, "placeholder": "Этапы работ"}),
            "pitch_deck_url": forms.URLInput(attrs={"class": "form-control", "placeholder": "https://example.com"}),
            "direction": forms.Select(attrs={"class": "form-control"}),
            "logo": forms.FileInput(attrs={"class": "form-control-file"}),
        }
        labels = {
            "title": "Название агентства *",
            "short_description": "*Короткое описание",
            "description": "*Полное описание",
            "terms": "Этапы работ",
            "pitch_deck_url": "Ссылка на презентацию",
            "direction": "Категория *",
            "stage": "Стадия *",
            "logo": "Логотип *",
            "creatives": "Изображения *",
            "video": "Видео",
            "proofs": "Документы",
            "agree_rules": "Согласен с правилами *",
            "agree_data_processing": "Согласен с обработкой данных *",
        }

    def clean(self):
        cleaned_data = super().clean()
        return self.clean_files(cleaned_data)

class SpecialistForm(BaseEntityFormMixin, forms.ModelForm):
    # --- Specialist-specific fields ---
    specialist_category = forms.ChoiceField(
        choices=[
            ("", "Выберите категорию"),
            ("Веб-разработка", "Веб-разработка"),
            ("Мобильная разработка", "Мобильная разработка"),
            ("Дизайн", "Дизайн"),
            ("Маркетинг", "Маркетинг"),
            ("ИИ", "ИИ"),
            ("Брендинг", "Брендинг"),
            ("Видео и мультимедиа", "Видео и мультимедиа"),
            ("Перевод", "Перевод"),
        ],
        label="Категория", required=False
    )
    terms = forms.CharField(widget=forms.Textarea(attrs={"rows": 5}), label="Услуги", required=False)
    additional_info = forms.CharField(widget=forms.Textarea(attrs={"rows": 5}), label="Услуги и кейсы", required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.init_planet_choices()

    class Meta:
        model = Specialists
        fields = [
            "title",
            "short_description",
            "description",
            "terms",
            "additional_info",
            "pitch_deck_url",
            "logo",

            "agree_rules",
            "agree_data_processing",
            "creatives",
            "proofs",
            "video",
            "planet_image",
            "catalog_card_image",
            "contact_website",
            "contact_telegram",
            "contact_whatsapp",
        ]
        widgets = {
            "title": forms.TextInput(attrs={"class": "form-control", "placeholder": "Имя/бренд специалиста"}),
            "short_description": forms.Textarea(attrs={"class": "form-control", "rows": 3, "placeholder": "Краткое описание"}),
            "description": forms.Textarea(attrs={"class": "form-control", "rows": 5, "placeholder": "Подробное описание"}),
            "terms": forms.Textarea(attrs={"class": "form-control", "rows": 5, "placeholder": "Этапы работ"}),
            "additional_info": forms.Textarea(attrs={"class": "form-control", "rows": 5, "placeholder": "Услуги и кейсы"}),
            "pitch_deck_url": forms.URLInput(attrs={"class": "form-control", "placeholder": "https://example.com"}),
            "direction": forms.Select(attrs={"class": "form-control"}),
            "logo": forms.FileInput(attrs={"class": "form-control-file"}),
        }
        labels = {
            "title": "Профиль специалиста *",
            "short_description": "*Короткое описание",
            "description": "*Полное описание",
            "terms": "Этапы работ",
            "additional_info": "Услуги и кейсы",
            "pitch_deck_url": "Ссылка на презентацию",
            "direction": "Категория *",
            "stage": "Стадия *",
            "logo": "Логотип *",
            "creatives": "Изображения *",
            "video": "Видео",
            "proofs": "Документы",
            "agree_rules": "Согласен с правилами *",
            "agree_data_processing": "Согласен с обработкой данных *",
        }

    def clean(self):
        cleaned_data = super().clean()
        return self.clean_files(cleaned_data)

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comments
        fields = ["content", "user_rating"]

class FranchiseCommentForm(forms.ModelForm):
    class Meta:
        from .models import FranchiseComments
        model = FranchiseComments
        fields = ["content", "user_rating"]
        widgets = {
            "content": forms.Textarea(
                attrs={
                    "rows": 4,
                    "placeholder": "Напишите ваш комментарий...",
                    "class": "form-control",
                }
            ),
            "user_rating": forms.HiddenInput(),
        }

class AgencyCommentForm(forms.ModelForm):
    class Meta:
        from .models import AgencyComments
        model = AgencyComments
        fields = ["content", "user_rating"]
        widgets = {
            "content": forms.Textarea(
                attrs={
                    "rows": 4,
                    "placeholder": "Напишите ваш комментарий...",
                    "class": "form-control",
                }
            ),
            "user_rating": forms.HiddenInput(),
        }

class SpecialistCommentForm(forms.ModelForm):
    class Meta:
        from .models import SpecialistComments
        model = SpecialistComments
        fields = ["content", "user_rating"]
        widgets = {
            "content": forms.Textarea(
                attrs={
                    "rows": 4,
                    "placeholder": "Напишите ваш комментарий...",
                    "class": "form-control",
                }
            ),
            "user_rating": forms.HiddenInput(),
        }
class NewsForm(forms.ModelForm):
    image = forms.ImageField(label="Картинка", required=False)

    class Meta:
        from .models import NewsArticles
        model = NewsArticles
        fields = ["title", "content", "category", "tags"]
        widgets = {
            "title": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "Заголовок новости"}
            ),
            "content": forms.Textarea(
                attrs={"class": "form-control", "rows": 8, "placeholder": "Текст новости"}
            ),
            "tags": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "AI, стартапы, инвестиции"}
            ),
            "category": forms.Select(attrs={"class": "form-control"}),
        }
        labels = {
            "title": "Заголовок",
            "content": "Текст новости",
            "category": "Категория",
            "tags": "Теги (через запятую)",
        }


class NewsEditForm(forms.ModelForm):
    image = forms.ImageField(label="Картинка", required=False)

    class Meta:
        from .models import NewsArticles
        model = NewsArticles
        fields = ["title", "content", "category", "tags", "status", "is_featured"]
        widgets = {
            "title": forms.TextInput(attrs={"class": "form-control"}),
            "content": forms.Textarea(attrs={"class": "form-control", "rows": 10}),
            "tags": forms.TextInput(attrs={"class": "form-control"}),
            "category": forms.Select(attrs={"class": "form-control"}),
            "status": forms.Select(attrs={"class": "form-control"}),
        }
        labels = {
            "title": "Заголовок",
            "content": "Текст новости",
            "category": "Категория",
            "tags": "Теги (через запятую)",
            "status": "Статус",
            "is_featured": "Закрепить на главной",
        }


class NewsCommentForm(forms.ModelForm):
    class Meta:
        from .models import NewsComments
        model = NewsComments
        fields = ["content"]
        widgets = {
            "content": forms.Textarea(
                attrs={
                    "rows": 4,
                    "placeholder": "Напишите ваш комментарий...",
                    "class": "form-control",
                }
            ),
        }


class MessageForm(forms.Form):
    message_text = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 2, "placeholder": "Введите сообщение..."}),
        label="Сообщение",
    )
class UserSearchForm(forms.Form):
    query = forms.CharField(
        required=False,
        label="Поиск",
        widget=forms.TextInput(attrs={"placeholder": "Поиск по имени или email..."}),
    )
    roles = forms.MultipleChoiceField(
        choices=[
            ("startuper", "Стартапер"),
            ("investor", "Пользователь"),
            ("moderator", "Модератор"),
        ],
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label="Роли",
    )
class ProfileEditForm(forms.ModelForm):
    telegram = forms.CharField(max_length=100, required=False, label="Телеграм")
    vk_url = forms.CharField(max_length=255, required=False, label="ВКонтакте")
    linkedin_url = forms.CharField(max_length=255, required=False, label="LinkedIn")
    class Meta:
        model = Users
        fields = [
            "first_name",
            "last_name",
            "website_url",
            "bio",
            "telegram",
            "vk_url",
            "linkedin_url",
        ]
        widgets = {
            'bio': forms.Textarea(attrs={'rows': 6, 'maxlength': 150, 'class': 'profile-edit-input'}),
            'first_name': forms.TextInput(attrs={'class': 'profile-edit-input'}),
            'last_name': forms.TextInput(attrs={'class': 'profile-edit-input'}),
            'website_url': forms.TextInput(attrs={'class': 'profile-edit-input'}),
            'telegram': forms.TextInput(attrs={'class': 'profile-edit-input'}),
            'vk_url': forms.TextInput(attrs={'class': 'profile-edit-input'}),
            'linkedin_url': forms.TextInput(attrs={'class': 'profile-edit-input'}),
        }
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['first_name'].widget.attrs['placeholder'] = 'Введите имя'
        self.fields['last_name'].widget.attrs['placeholder'] = 'Введите фамилию'
        self.fields['website_url'].widget.attrs['placeholder'] = 'https://example.com'
        self.fields['telegram'].widget.attrs['placeholder'] = '@username'
        self.fields['vk_url'].widget.attrs['placeholder'] = 'https://vk.com/username'
        self.fields['linkedin_url'].widget.attrs['placeholder'] = 'https://linkedin.com/in/username'
    def clean_telegram(self):
        telegram = self.cleaned_data.get("telegram")
        if telegram and not telegram.startswith("@"):
            telegram = f"@{telegram}"
        return telegram
    def clean_bio(self):
        bio = self.cleaned_data.get("bio")
        if bio and len(bio) > 50:
            raise forms.ValidationError("Описание не должно превышать 50 символов.")
        return bio
class SupportTicketForm(forms.ModelForm):
    class Meta:
        model = SupportTicket
        fields = ['subject', 'message']
        widgets = {
            'subject': forms.TextInput(attrs={'placeholder': 'Тема обращения'}),
            'message': forms.Textarea(attrs={'rows': 5, 'placeholder': 'Опишите вашу проблему или вопрос...'}),
        }
        labels = {
            'subject': 'Тема',
            'message': 'Сообщение',
        }
class ModeratorTicketForm(forms.ModelForm):
    class Meta:
        model = SupportTicket
        fields = ['moderator_comment']
        widgets = {
            'moderator_comment': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Добавьте комментарий...'}),
        }
        labels = {
            'moderator_comment': 'Комментарий',
        }

class ContactForm(forms.Form):
    name = forms.CharField(max_length=100, label="Ваше имя")
    email = forms.EmailField(label="Электронная почта")
    subject = forms.ChoiceField(
        choices=[
            ('general_inquiry', 'Общий вопрос'),
            ('technical_support', 'Техническая поддержка'),
            ('business_cooperation', 'Бизнес-сотрудничество'),
            ('partnership', 'Партнерство'),
            ('investment', 'Инвестиции'),
            ('other', 'Другое')
        ],
        label="Тема"
    )
    message = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 5}),
        label="Сообщение"
    )
    captcha_answer = forms.CharField(required=False, label="Ответ на капчу")


class FranchiseEditForm(BaseEntityEditFormMixin, forms.ModelForm):
    # --- Franchise-specific edit fields ---
    direction = DirectionModelChoiceField(
        queryset=Directions.objects.filter(
            direction_name__in=["Beauty", "Cafe", "Delivery", "Fastfood", "Finance", "Healthcare", "Sport", "Technology"]
        ).order_by("direction_name"),
        label="Категория", required=False, empty_label="Выберите категорию"
    )

    class Meta:
        model = Franchises
        fields = [
            "title", "short_description", "description", "terms",
            "investment_size", "franchise_cost", "pitch_deck_url",
            "logo", "direction", "creatives", "proofs", "video",
            "planet_image", "catalog_card_image", "profit_calculation",
            "contact_website", "contact_telegram", "contact_whatsapp",
        ]
        labels = {
            "title": "Название",
            "short_description": "*Короткое описание",
            "description": "*Полное описание",
            "terms": "Условия",
            "investment_size": "Размер инвестиций (₽)",
            "franchise_cost": "Паушальный взнос (₽)",
            "pitch_deck_url": "Ссылка на презентацию",
            "contact_website": "Сайт",
            "contact_telegram": "Telegram",
            "contact_whatsapp": "WhatsApp",
            "direction": "Категория",
            "logo": "Логотип",
            "creatives": "Изображения",
            "video": "Видео",
            "proofs": "Документы",
            "profit_calculation": "Стоимость и расчет прибыли",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.init_planet_choices()


class AgencyEditForm(BaseEntityEditFormMixin, forms.ModelForm):
    # --- Agency-specific edit fields ---
    agency_category = forms.ChoiceField(
        choices=[
            ("", "Выберите категорию"),
            ("Веб-разработка", "Веб-разработка"),
            ("Мобильная разработка", "Мобильная разработка"),
            ("Дизайн", "Дизайн"),
            ("Маркетинг", "Маркетинг"),
            ("ИИ", "ИИ"),
            ("Брендинг", "Брендинг"),
            ("Видео и мультимедиа", "Видео и мультимедиа"),
            ("Перевод", "Перевод"),
        ],
        label="Категория", required=False
    )
    agency_services = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 5}), label="Услуги", required=False
    )
    video = forms.FileField(
        required=False, help_text="Загрузите новое видео (1 файл: MP4, MOV)",
        widget=forms.ClearableFileInput(attrs={'accept': 'video/*'})
    )
    catalog_card_image = forms.ImageField(
        label="Изображение для карточки в каталоге",
        required=False,
        help_text="Загрузите широкоформатное изображение (рекомендуемое разрешение 1200×400, форматы: PNG, JPEG, WEBP, максимум 5MB)",
        widget=forms.ClearableFileInput(attrs={'accept': 'image/*'})
    )
    short_description = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 3}), label="*Короткое описание", required=True
    )
    terms = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 5}), label="Этапы работ", required=False
    )
    planet_image = forms.ChoiceField(
        choices=[],
        label="Выберите планету",
        required=False,
        widget=forms.HiddenInput(attrs={"id": "id_planet_image"}),
    )
    successful_projects = forms.IntegerField(
        label="Успешных проектов",
        required=False,
        help_text="Количество успешно реализованных проектов"
    )

    class Meta:
        model = Agencies
        fields = [
            "title", "short_description", "description", "terms",
            "pitch_deck_url", "logo", "direction", "stage",
            "creatives", "proofs", "video", "planet_image", "catalog_card_image", "successful_projects",
            "contact_website", "contact_telegram", "contact_whatsapp",
        ]
        labels = {
            "title": "Название",
            "pitch_deck_url": "Ссылка на презентацию",
            "contact_website": "Сайт",
            "contact_telegram": "Telegram",
            "contact_whatsapp": "WhatsApp",
        }
        widgets = {
            "pitch_deck_url": forms.URLInput(attrs={"class": "form-control", "placeholder": "https://example.com"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.init_planet_choices()

        if self.instance and self.instance.pk:
            if hasattr(self.instance, 'customization_data') and self.instance.customization_data:
                self.fields['successful_projects'].initial = self.instance.customization_data.get('successful_projects')
                self.fields['agency_category'].initial = self.instance.customization_data.get('agency_category', '')
                self.fields['agency_services'].initial = self.instance.customization_data.get('agency_services', '')


class SpecialistEditForm(BaseEntityEditFormMixin, forms.ModelForm):
    # --- Specialist-specific edit fields ---
    specialist_category = forms.ChoiceField(
        choices=[
            ("", "Выберите категорию"),
            ("Веб-разработка", "Веб-разработка"),
            ("Мобильная разработка", "Мобильная разработка"),
            ("Дизайн", "Дизайн"),
            ("Маркетинг", "Маркетинг"),
            ("ИИ", "ИИ"),
            ("Брендинг", "Брендинг"),
            ("Видео и мультимедиа", "Видео и мультимедиа"),
            ("Перевод", "Перевод"),
        ],
        label="Категория", required=False
    )
    video = forms.FileField(
        required=False, help_text="Загрузите новое видео (1 файл: MP4, MOV)",
        widget=forms.ClearableFileInput(attrs={'accept': 'video/*'})
    )
    terms = forms.CharField(widget=forms.Textarea(attrs={"rows": 5}), label="Услуги", required=False)
    additional_info = forms.CharField(widget=forms.Textarea(attrs={"rows": 5}), label="Услуги и кейсы", required=False)
    successful_projects = forms.IntegerField(label="Успешных проектов", required=False)

    class Meta:
        model = Specialists
        fields = [
            "title", "short_description", "description", "terms", "additional_info",
            "pitch_deck_url", "logo", "direction", "stage",
            "creatives", "proofs", "video", "planet_image", "catalog_card_image", "successful_projects",
            "contact_website", "contact_telegram", "contact_whatsapp",
        ]
        labels = {
            "title": "Профиль специалиста",
            "short_description": "*Короткое описание",
            "description": "*Полное описание",
            "terms": "Этапы работ",
            "additional_info": "Услуги и кейсы",
            "pitch_deck_url": "Ссылка на презентацию",
            "direction": "Категория",
            "contact_website": "Сайт",
            "contact_telegram": "Telegram",
            "contact_whatsapp": "WhatsApp",
            "logo": "Логотип",
            "creatives": "Изображения",
            "video": "Видео",
            "proofs": "Документы",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.init_planet_choices()

        if self.instance and self.instance.pk:
            if hasattr(self.instance, 'customization_data') and self.instance.customization_data:
                self.fields['successful_projects'].initial = self.instance.customization_data.get('successful_projects')
                self.fields['specialist_category'].initial = self.instance.customization_data.get('specialist_category', '')