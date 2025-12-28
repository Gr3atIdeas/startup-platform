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
    role = forms.ModelChoiceField(
        queryset=Roles.objects.filter(role_name__in=['startuper', 'investor']),
        label="Роль",
        empty_label="Выберите роль"
    )
    class Meta:
        model = Users
        fields = ["email", "first_name", "last_name", "phone", "role"]
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

class StartupEditForm(forms.ModelForm):
    logo = forms.ImageField(
        label="Логотип",
        required=False,
        help_text="Загрузите новый логотип стартапа (изображение)",
    )
    creatives = forms.FileField(
        required=False, help_text="Загрузите новые изображения (до 10 файлов: PNG, JPEG)",
        widget=forms.ClearableFileInput(attrs={'accept': 'image/*'})
    )
    proofs = forms.FileField(
        required=False, help_text="Загрузите новые документы (до 15 файлов: PDF, DOC, TXT)",
        widget=forms.ClearableFileInput(attrs={'accept': '.pdf,.doc,.docx,.txt'})
    )
    direction = forms.ModelChoiceField(
        queryset=Directions.objects.none(), label="Направление *", required=True
    )
    stage = forms.ModelChoiceField(
        queryset=StartupStages.objects.all(), label="Стадия", required=False, empty_label="Выберите стадию"
    )
    micro_investment_available = forms.BooleanField(
        required=False, label="Микроинвестиции доступны"
    )
    video = forms.FileField(required=False, help_text="Загрузите новое видео (1 файл: MP4, MOV)",
        widget=forms.ClearableFileInput(attrs={'accept': 'video/*'}))
    catalog_card_image = forms.ImageField(
        label="Изображение для карточки в каталоге",
        required=False,
        help_text="Загрузите широкоформатное изображение (рекомендуемое разрешение 1200×400, форматы: PNG, JPEG, WEBP, максимум 5MB)",
        widget=forms.ClearableFileInput(attrs={'accept': 'image/*'})
    )
    short_description = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 3}), label="*Вводная", required=True
    )
    terms = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 5}), label="Условия", required=False
    )
    planet_image = forms.ChoiceField(
        choices=[],
        label="Выберите планету",
        required=False,
        widget=forms.HiddenInput(attrs={"id": "id_planet_image"}),
    )
    INVESTMENT_TYPE_CHOICES = [
        ("", "Выберите тип"),
        ("invest", "Инвестирование"),
        ("buy", "Выкуп"),
        ("both", "Инвестирование + Выкуп"),
    ]
    investment_type = forms.ChoiceField(
        choices=INVESTMENT_TYPE_CHOICES,
        label="Тип инвестирования",
        required=False,
        widget=forms.Select(attrs={"class": "form-control"}),
    )
    funding_goal = forms.IntegerField(
        label="Цель финансирования *",
        required=True,
        widget=forms.NumberInput(attrs={"class": "form-control", "placeholder": "Введите сумму ₽"}),
    )
    pitch_deck_url = forms.URLField(
        label="Ссылка на презентацию",
        required=False,
        widget=forms.URLInput(attrs={"class": "form-control", "placeholder": "URL"}),
    )
    valuation = forms.IntegerField(
        label="Оценка",
        required=False,
        widget=forms.NumberInput(attrs={"class": "form-control", "placeholder": "1"}),
    )
    amount_raised = forms.IntegerField(
        label="Собранная сумма (₽)",
        required=False,
        widget=forms.NumberInput(attrs={"class": "form-control", "placeholder": "Введите сумму"}),
    )

    def clean_description(self):
        """Разрешаем HTML теги в описании для вставки изображений/видео"""
        description = self.cleaned_data.get('description', '')
        if description:
            description = convert_newlines_to_html(description)
        return description
    
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
        ]
        labels = {
            "title": "Название",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        if self.instance and self.instance.pk and hasattr(self.instance, 'description'):
            if self.instance.description:
                self.fields['description'].initial = convert_html_to_newlines(self.instance.description)
        
        allowed_startup_directions = [
            'Technology', 'Finance', 'Education', 'Entertainment',
            'Fashion', 'Food', 'Gaming', 'Real Estate', 'Travel', 'Agriculture',
            'Energy', 'Environment', 'Social', 'Auto', 'Delivery',
            'Cafe', 'Fastfood', 'Health', 'Beauty', 'Transport', 'Sport',
            'Psychology', 'AI', 'IT', 'Retail'
        ]
        extra_old = []
        if getattr(self, 'instance', None) and getattr(self.instance, 'direction', None):
            current_dir = getattr(self.instance.direction, 'direction_name', None)
            if current_dir in ['Healthcare', 'Medicine']:
                extra_old = ['Healthcare', 'Medicine']
        queryset_names = allowed_startup_directions + extra_old
        self.fields["direction"].queryset = Directions.objects.filter(
            direction_name__in=queryset_names
        ).order_by("direction_name")

        direction_translations = {
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
        }
        def _label_from_instance_edit(obj):
            name = getattr(obj, "direction_name", str(obj))
            return direction_translations.get(name, name)
        self.fields["direction"].label_from_instance = _label_from_instance_edit
        try:
            self.fields["planet_image"].choices = [(p, p) for p in get_planet_urls()]
        except Exception as e:
            print(f"Error fetching planet URLs: {e}")
            self.fields["planet_image"].choices = []

class StartupForm(forms.ModelForm):
    logo = forms.ImageField(
        label="Логотип *",
        required=True,
        help_text="Загрузите логотип стартапа (изображение)",
    )
    creatives = forms.FileField(
        required=True, help_text="Загрузите изображения (до 10 файлов: PNG, JPEG)"
    )
    proofs = forms.FileField(
        required=False, help_text="Загрузите документы (до 10 файлов: PDF, DOC, TXT)"
    )
    direction = forms.ModelChoiceField(
        queryset=Directions.objects.none(), label="Направление *", required=True
    )
    stage = forms.ModelChoiceField(
        queryset=StartupStages.objects.all(), label="Стадия", required=False, empty_label="Выберите стадию"
    )
    agree_rules = forms.BooleanField(label="Согласен с правилами *", required=True)
    agree_data_processing = forms.BooleanField(
        label="Согласен с обработкой данных *", required=True
    )
    micro_investment_available = forms.BooleanField(
        required=False, label="Микроинвестиции доступны"
    )
    video = forms.FileField(required=False, help_text="Загрузите видео (1 файл: MP4, MOV)")
    catalog_card_image = forms.ImageField(
        label="Изображение для карточки в каталоге",
        required=False,
        help_text="Загрузите широкоформатное изображение (рекомендуемое разрешение 1200×400, форматы: PNG, JPEG, WEBP, максимум 5MB)"
    )
    short_description = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 3}), label="*Вводная", required=True
    )
    terms = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 5}), label="Условия", required=False
    )
    planet_image = forms.ChoiceField(
        choices=[],
        label="Выберите планету",
        required=False,
        widget=forms.HiddenInput(attrs={"id": "id_planet_image"}),
    )
    INVESTMENT_TYPE_CHOICES = [
        ("", "Выберите тип"),
        ("invest", "Инвестирование"),
        ("buy", "Выкуп"),
        ("both", "Инвестирование + Выкуп"),
    ]
    investment_type = forms.ChoiceField(
        choices=INVESTMENT_TYPE_CHOICES,
        label="Тип инвестирования",
        required=False,
        widget=forms.Select(attrs={"class": "form-control"}),
    )
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            planet_urls = get_planet_urls()
            self.fields["planet_image"].choices = [(p, p) for p in planet_urls]
            
            # Если у стартапа уже есть планета, добавляем её в choices если её там нет
            if hasattr(self, 'instance') and self.instance and hasattr(self.instance, 'planet_image'):
                current_planet = self.instance.planet_image
                if current_planet and current_planet not in planet_urls:
                    # Добавляем текущую планету в начало списка
                    self.fields["planet_image"].choices = [(current_planet, current_planet)] + self.fields["planet_image"].choices
        except Exception as e:
            print(f"Error fetching planet URLs: {e}")
            self.fields["planet_image"].choices = []
        allowed_startup_directions = [
            'Technology', 'Finance', 'Education', 'Entertainment',
            'Fashion', 'Food', 'Gaming', 'Real Estate', 'Travel', 'Agriculture',
            'Energy', 'Environment', 'Social', 'Auto', 'Delivery',
            'Cafe', 'Fastfood', 'Health', 'Beauty', 'Transport', 'Sport',
            'Psychology', 'AI', 'IT', 'Retail'
        ]
        extra_old = []
        if getattr(self, 'instance', None) and getattr(self.instance, 'direction', None):
            current_dir = getattr(self.instance.direction, 'direction_name', None)
            if current_dir in ['Healthcare', 'Medicine']:
                extra_old = ['Healthcare', 'Medicine']
        queryset_names = allowed_startup_directions + extra_old
        self.fields["direction"].queryset = Directions.objects.filter(
            direction_name__in=queryset_names
        ).order_by("direction_name")
        direction_translations = {
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
        }
        def _label_from_instance(obj):
            name = getattr(obj, "direction_name", str(obj))
            return direction_translations.get(name, name)
        self.fields["direction"].label_from_instance = _label_from_instance
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
            "short_description": "*Вводная",
            "description": "*Описание",
            "terms": "Условия",
            "funding_goal": "Цель финансирования (₽) *",
            "amount_raised": "Собранная сумма (₽)",
            "valuation": "Оценка (₽)",
            "pitch_deck_url": "URL презентации",
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
        if not self.instance or not self.instance.pk:
            if Startups.objects.filter(title__iexact=title).exists():
                raise forms.ValidationError("Стартап с таким названием уже существует.")
        else:
            if (
                Startups.objects.filter(title__iexact=title)
                .exclude(pk=self.instance.pk)
                .exists()
            ):
                raise forms.ValidationError(
                    "Другой стартап с таким названием уже существует."
                )
        return title
    def clean(self):
        cleaned_data = super().clean()
        creatives = cleaned_data.get("creatives", [])
        if isinstance(creatives, list) and all(
            isinstance(item, list) for item in creatives
        ):
            cleaned_data["creatives"] = [
                file for sublist in creatives for file in sublist
            ]
        elif creatives and not isinstance(creatives, list):
            cleaned_data["creatives"] = [creatives]
        else:
            cleaned_data["creatives"] = creatives if creatives else []
        if len(cleaned_data.get("creatives", [])) == 0:
            self.add_error("creatives", "Загрузите хотя бы одно изображение (до 10 файлов).")
        elif len(cleaned_data.get("creatives", [])) > 10:
            self.add_error("creatives", "Можно прикрепить не более 10 изображений.")

        proofs = cleaned_data.get("proofs", [])
        if isinstance(proofs, list) and all(isinstance(item, list) for item in proofs):
            cleaned_data["proofs"] = [file for sublist in proofs for file in sublist]
        elif proofs and not isinstance(proofs, list):
            cleaned_data["proofs"] = [proofs]
        else:
            cleaned_data["proofs"] = proofs if proofs else []
        if len(cleaned_data.get("proofs", [])) > 10:
            self.add_error("proofs", "Можно прикрепить не более 10 документов.")

        videos = cleaned_data.get("video", [])
        if isinstance(videos, list) and all(isinstance(item, list) for item in videos):
            cleaned_data["video"] = [file for sublist in videos for file in sublist]
        elif videos and not isinstance(videos, list):
            cleaned_data["video"] = [videos]
        else:
            cleaned_data["video"] = videos if videos else []

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

class FranchiseForm(forms.ModelForm):
    logo = forms.ImageField(label="Логотип *", required=True)
    creatives = forms.FileField(
        required=False,  # Делаем False, т.к. валидация через request.FILES.getlist
        help_text="Загрузите изображения (до 10 файлов: PNG, JPEG)"
    )
    proofs = forms.FileField(
        required=False, 
        help_text="Загрузите документы (до 10 файлов: PDF, DOC, TXT)"
    )
    direction = DirectionModelChoiceField(
        queryset=Directions.objects.filter(
            direction_name__in=[
                "Beauty",
                "Cafe",
                "Delivery",
                "Fastfood",
                "Finance",
                "Healthcare",
                "Sport",
                "Technology",
            ]
        ).order_by("direction_name"),
        label="Категория *",
        required=True,
    )

    agree_rules = forms.BooleanField(label="Согласен с правилами *", required=True)
    agree_data_processing = forms.BooleanField(label="Согласен с обработкой данных *", required=True)
    video = forms.FileField(required=False, help_text="Загрузите видео (MP4, MOV)")
    catalog_card_image = forms.ImageField(
        label="Изображение для карточки в каталоге",
        required=False,
        help_text="Загрузите широкоформатное изображение (рекомендуемое разрешение 1200×400, форматы: PNG, JPEG, WEBP, максимум 5MB)"
    )
    short_description = forms.CharField(widget=forms.Textarea(attrs={"rows": 3}), label="*Вводная", required=True)
    terms = forms.CharField(widget=forms.Textarea(attrs={"rows": 5}), label="Условия", required=False)
    planet_image = forms.ChoiceField(choices=[], label="Выберите планету", required=False, widget=forms.HiddenInput(attrs={"id": "id_planet_image"}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        if self.instance and self.instance.pk and hasattr(self.instance, 'description'):
            if self.instance.description:
                self.fields['description'].initial = convert_html_to_newlines(self.instance.description)
        
        try:
            self.fields["planet_image"].choices = [(p, p) for p in get_planet_urls()]
        except Exception as e:
            print(f"Error fetching planet URLs: {e}")
            self.fields["planet_image"].choices = []

    def clean_description(self):
        """Разрешаем HTML теги в описании для вставки изображений/видео"""
        description = self.cleaned_data.get('description', '')
        if description:
            description = convert_newlines_to_html(description)
        return description

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
            "short_description": "*Вводная",
            "description": "*Описание",
            "terms": "Условия",
            "investment_size": "Размер инвестиций (₽)",
            "franchise_cost": "Паушальный взнос (₽)",
            "pitch_deck_url": "URL презентации",
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
        creatives = cleaned_data.get("creatives", [])
        if isinstance(creatives, list) and all(isinstance(item, list) for item in creatives):
            cleaned_data["creatives"] = [file for sublist in creatives for file in sublist]
        elif creatives and not isinstance(creatives, list):
            cleaned_data["creatives"] = [creatives]
        else:
            cleaned_data["creatives"] = creatives if creatives else []
        proofs = cleaned_data.get("proofs", [])
        if isinstance(proofs, list) and all(isinstance(item, list) for item in proofs):
            cleaned_data["proofs"] = [file for sublist in proofs for file in sublist]
        elif proofs and not isinstance(proofs, list):
            cleaned_data["proofs"] = [proofs]
        else:
            cleaned_data["proofs"] = proofs if proofs else []
        return cleaned_data

class AgencyForm(forms.ModelForm):
    logo = forms.ImageField(label="Логотип *", required=True)
    creatives = forms.FileField(
        required=False,  # Делаем False, т.к. валидация через request.FILES.getlist
        help_text="Загрузите изображения (до 10 файлов: PNG, JPEG)"
    )
    proofs = forms.FileField(
        required=False, 
        help_text="Загрузите документы (до 10 файлов: PDF, DOC, TXT)"
    )
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

    agree_rules = forms.BooleanField(label="Согласен с правилами *", required=True)
    agree_data_processing = forms.BooleanField(label="Согласен с обработкой данных *", required=True)
    video = forms.FileField(required=False, help_text="Загрузите видео (MP4, MOV)")
    catalog_card_image = forms.ImageField(
        label="Изображение для карточки в каталоге",
        required=False,
        help_text="Загрузите широкоформатное изображение (рекомендуемое разрешение 1200×400, форматы: PNG, JPEG, WEBP, максимум 5MB)"
    )
    short_description = forms.CharField(widget=forms.Textarea(attrs={"rows": 3}), label="*Вводная", required=True)
    terms = forms.CharField(widget=forms.Textarea(attrs={"rows": 5}), label="Этапы работ", required=False)
    planet_image = forms.ChoiceField(choices=[], label="Выберите планету", required=False, widget=forms.HiddenInput(attrs={"id": "id_planet_image"}))
    successful_projects = forms.IntegerField(
        label="Успешных проектов",
        required=False,
        initial=12,
        help_text="Количество успешно реализованных проектов"
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        if self.instance and self.instance.pk and hasattr(self.instance, 'description'):
            if self.instance.description:
                self.fields['description'].initial = convert_html_to_newlines(self.instance.description)
        
        try:
            self.fields["planet_image"].choices = [(p, p) for p in get_planet_urls()]
        except Exception as e:
            print(f"Error fetching planet URLs: {e}")
            self.fields["planet_image"].choices = []

    def clean_description(self):
        """Разрешаем HTML теги в описании для вставки изображений/видео"""
        description = self.cleaned_data.get('description', '')
        if description:
            description = convert_newlines_to_html(description)
        return description

    class Meta:
        model = Agencies
        fields = [
            "title",
            "short_description",
            "description",
            "terms",
            "logo",

            "agree_rules",
            "agree_data_processing",
            "creatives",
            "proofs",
            "video",
            "planet_image",
            "catalog_card_image",
            "successful_projects",
        ]
        widgets = {
            "title": forms.TextInput(attrs={"class": "form-control", "placeholder": "Название агентства"}),
            "short_description": forms.Textarea(attrs={"class": "form-control", "rows": 3, "placeholder": "Краткое описание агентства"}),
            "description": forms.Textarea(attrs={"class": "form-control", "rows": 5, "placeholder": "Подробное описание агентства"}),
            "terms": forms.Textarea(attrs={"class": "form-control", "rows": 5, "placeholder": "Этапы работ"}),
            "direction": forms.Select(attrs={"class": "form-control"}),
            "logo": forms.FileInput(attrs={"class": "form-control-file"}),
        }
        labels = {
            "title": "Название агентства *",
            "short_description": "*Вводная",
            "description": "*Описание",
            "terms": "Этапы работ",
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
        creatives = cleaned_data.get("creatives", [])
        if isinstance(creatives, list) and all(isinstance(item, list) for item in creatives):
            cleaned_data["creatives"] = [file for sublist in creatives for file in sublist]
        elif creatives and not isinstance(creatives, list):
            cleaned_data["creatives"] = [creatives]
        else:
            cleaned_data["creatives"] = creatives if creatives else []
        proofs = cleaned_data.get("proofs", [])
        if isinstance(proofs, list) and all(isinstance(item, list) for item in proofs):
            cleaned_data["proofs"] = [file for sublist in proofs for file in sublist]
        elif proofs and not isinstance(proofs, list):
            cleaned_data["proofs"] = [proofs]
        else:
            cleaned_data["proofs"] = proofs if proofs else []
        return cleaned_data

class SpecialistForm(forms.ModelForm):
    logo = forms.ImageField(label="Логотип *", required=True)
    creatives = forms.FileField(
        required=False,  # Делаем False, т.к. валидация через request.FILES.getlist
        help_text="Загрузите изображения (до 10 файлов: PNG, JPEG)"
    )
    proofs = forms.FileField(
        required=False, 
        help_text="Загрузите документы (до 10 файлов: PDF, DOC, TXT)"
    )
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

    agree_rules = forms.BooleanField(label="Согласен с правилами *", required=True)
    agree_data_processing = forms.BooleanField(label="Согласен с обработкой данных *", required=True)
    video = forms.FileField(required=False, help_text="Загрузите видео (MP4, MOV)")
    catalog_card_image = forms.ImageField(
        label="Изображение для карточки в каталоге",
        required=False,
        help_text="Загрузите широкоформатное изображение (рекомендуемое разрешение 1200×400, форматы: PNG, JPEG, WEBP, максимум 5MB)"
    )
    short_description = forms.CharField(widget=forms.Textarea(attrs={"rows": 3}), label="*Вводная", required=True)
    terms = forms.CharField(widget=forms.Textarea(attrs={"rows": 5}), label="Услуги", required=False)
    additional_info = forms.CharField(widget=forms.Textarea(attrs={"rows": 5}), label="Услуги и кейсы", required=False)
    planet_image = forms.ChoiceField(choices=[], label="Выберите планету", required=False, widget=forms.HiddenInput(attrs={"id": "id_planet_image"}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        if self.instance and self.instance.pk and hasattr(self.instance, 'description'):
            if self.instance.description:
                self.fields['description'].initial = convert_html_to_newlines(self.instance.description)
        
        try:
            self.fields["planet_image"].choices = [(p, p) for p in get_planet_urls()]
        except Exception as e:
            print(f"Error fetching planet URLs: {e}")
            self.fields["planet_image"].choices = []

    def clean_description(self):
        """Разрешаем HTML теги в описании для вставки изображений/видео"""
        description = self.cleaned_data.get('description', '')
        if description:
            description = convert_newlines_to_html(description)
        return description

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
            "short_description": "*Вводная",
            "description": "*Описание",
            "terms": "Этапы работ",
            "additional_info": "Услуги и кейсы",
            "pitch_deck_url": "URL презентации",
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
        creatives = cleaned_data.get("creatives", [])
        if isinstance(creatives, list) and all(isinstance(item, list) for item in creatives):
            cleaned_data["creatives"] = [file for sublist in creatives for file in sublist]
        elif creatives and not isinstance(creatives, list):
            cleaned_data["creatives"] = [creatives]
        else:
            cleaned_data["creatives"] = creatives if creatives else []
        proofs = cleaned_data.get("proofs", [])
        if isinstance(proofs, list) and all(isinstance(item, list) for item in proofs):
            cleaned_data["proofs"] = [file for sublist in proofs for file in sublist]
        elif proofs and not isinstance(proofs, list):
            cleaned_data["proofs"] = [proofs]
        else:
            cleaned_data["proofs"] = proofs if proofs else []
        return cleaned_data
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


class FranchiseEditForm(forms.ModelForm):
    logo = forms.ImageField(
        label="Логотип",
        required=False,
        help_text="Загрузите новый логотип франшизы (изображение)",
    )
    creatives = forms.FileField(
        required=False, help_text="Загрузите новые изображения (до 10 файлов: PNG, JPEG)",
        widget=forms.ClearableFileInput(attrs={'accept': 'image/*'})
    )
    proofs = forms.FileField(
        required=False, help_text="Загрузите новые документы (до 15 файлов: PDF, DOC, TXT)",
        widget=forms.ClearableFileInput(attrs={'accept': '.pdf,.doc,.docx,.txt'})
    )
    direction = forms.ModelChoiceField(
        queryset=Directions.objects.filter(
            direction_name__in=[
                "Beauty", "Cafe", "Delivery", "Fastfood", "Finance",
                "Healthcare", "Sport", "Technology",
            ]
        ).order_by("direction_name"),
        label="Категория", required=False, empty_label="Выберите категорию"
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
        widget=forms.Textarea(attrs={"rows": 3}), label="*Вводная", required=True
    )
    terms = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 5}), label="Условия", required=False
    )
    planet_image = forms.ChoiceField(
        choices=[],
        label="Выберите планету",
        required=False,
        widget=forms.HiddenInput(attrs={"id": "id_planet_image"}),
    )

    class Meta:
        model = Franchises
        fields = [
            "title", "short_description", "description", "terms",
            "investment_size", "franchise_cost", "pitch_deck_url",
            "logo", "direction", "creatives", "proofs", "video",
            "planet_image", "catalog_card_image", "profit_calculation"
        ]
        labels = {
            "title": "Название",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            self.fields["planet_image"].choices = [(p, p) for p in get_planet_urls()]
        except Exception as e:
            self.fields["planet_image"].choices = []

    def clean_description(self):
        """Разрешаем HTML теги в описании для вставки изображений/видео"""
        description = self.cleaned_data.get('description', '')
        if description:
            description = convert_newlines_to_html(description)
        return description


class AgencyEditForm(forms.ModelForm):
    logo = forms.ImageField(
        label="Логотип",
        required=False,
        help_text="Загрузите новый логотип агентства (изображение)",
    )
    creatives = forms.FileField(
        required=False, help_text="Загрузите новые изображения (до 10 файлов: PNG, JPEG)",
        widget=forms.ClearableFileInput(attrs={'accept': 'image/*'})
    )
    proofs = forms.FileField(
        required=False, help_text="Загрузите новые документы (до 15 файлов: PDF, DOC, TXT)",
        widget=forms.ClearableFileInput(attrs={'accept': '.pdf,.doc,.docx,.txt'})
    )
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
        widget=forms.Textarea(attrs={"rows": 3}), label="*Вводная", required=True
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
        initial=12,
        help_text="Количество успешно реализованных проектов"
    )

    class Meta:
        model = Agencies
        fields = [
            "title", "short_description", "description", "terms",
            "logo", "direction", "stage",
            "creatives", "proofs", "video", "planet_image", "catalog_card_image", "successful_projects"
        ]
        labels = {
            "title": "Название",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        if self.instance and self.instance.pk:
            if hasattr(self.instance, 'description') and self.instance.description:
                self.fields['description'].initial = convert_html_to_newlines(self.instance.description)
            
            if hasattr(self.instance, 'customization_data') and self.instance.customization_data:
                self.fields['successful_projects'].initial = self.instance.customization_data.get('successful_projects', 12)
                self.fields['agency_category'].initial = self.instance.customization_data.get('agency_category', '')
                self.fields['agency_services'].initial = self.instance.customization_data.get('agency_services', '')
        
        try:
            self.fields["planet_image"].choices = [(p, p) for p in get_planet_urls()]
        except Exception as e:
            self.fields["planet_image"].choices = []

    def clean_description(self):
        """Разрешаем HTML теги в описании для вставки изображений/видео"""
        description = self.cleaned_data.get('description', '')
        if description:
            description = convert_newlines_to_html(description)
        return description


class SpecialistEditForm(forms.ModelForm):
    logo = forms.ImageField(
        label="Логотип",
        required=False,
        help_text="Загрузите новый логотип специалиста (изображение)",
    )
    creatives = forms.FileField(
        required=False, help_text="Загрузите новые изображения (до 10 файлов: PNG, JPEG)",
        widget=forms.ClearableFileInput(attrs={'accept': 'image/*'})
    )
    proofs = forms.FileField(
        required=False, help_text="Загрузите новые документы (до 15 файлов: PDF, DOC, TXT)",
        widget=forms.ClearableFileInput(attrs={'accept': '.pdf,.doc,.docx,.txt'})
    )
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
    catalog_card_image = forms.ImageField(
        label="Изображение для карточки в каталоге",
        required=False,
        help_text="Загрузите широкоформатное изображение (рекомендуемое разрешение 1200×400, форматы: PNG, JPEG, WEBP, максимум 5MB)",
        widget=forms.ClearableFileInput(attrs={'accept': 'image/*'})
    )
    short_description = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 3}), label="*Вводная", required=True
    )
    terms = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 5}), label="Услуги", required=False
    )
    additional_info = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 5}), label="Услуги и кейсы", required=False
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
        initial=12,
        help_text="Количество успешно реализованных проектов"
    )

    class Meta:
        model = Specialists
        fields = [
            "title", "short_description", "description", "terms", "additional_info",
            "pitch_deck_url", "logo", "direction", "stage",
            "creatives", "proofs", "video", "planet_image", "catalog_card_image", "successful_projects"
        ]
        labels = {
            "title": "Название",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            self.fields["planet_image"].choices = [(p, p) for p in get_planet_urls()]
        except Exception as e:
            self.fields["planet_image"].choices = []
        
        # Инициализируем successful_projects из customization_data
        if self.instance and self.instance.pk:
            if hasattr(self.instance, 'description') and self.instance.description:
                self.fields['description'].initial = convert_html_to_newlines(self.instance.description)
            
            if hasattr(self.instance, 'customization_data') and self.instance.customization_data:
                self.fields['successful_projects'].initial = self.instance.customization_data.get('successful_projects', 12)
                self.fields['specialist_category'].initial = self.instance.customization_data.get('specialist_category', '')

    def clean_description(self):
        """Разрешаем HTML теги в описании для вставки изображений/видео"""
        description = self.cleaned_data.get('description', '')
        if description:
            description = convert_newlines_to_html(description)
        return description