from django import forms
from .models import Comments, Directions, Roles, Startups, StartupStages, Users, ChatConversations, TransactionTypes, UserVotes, SupportTicket, Franchises, Agencies, Specialists
from .utils import get_planet_urls
class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True
class MultipleFileField(forms.FileField):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget", MultipleFileInput())
        super().__init__(*args, **kwargs)
    def to_python(self, data):
        if not data:
            return []
        if isinstance(data, list):
            return data
        return [data] if data else []
    def clean(self, data, initial=None):
        files = data if isinstance(data, list) else [data] if data else []
        cleaned_files = []
        for file in files:
            if file:
                cleaned_files.append(super().clean(file, initial))
        return cleaned_files
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
    email = forms.EmailField(label="Email")
    password = forms.CharField(widget=forms.PasswordInput, label="Пароль")

    def clean(self):
        cleaned_data = super().clean()
        hp_value = cleaned_data.get("hp_field")
        if hp_value:
            raise forms.ValidationError("Обнаружена подозрительная активность.")
        return cleaned_data
class StartupForm(forms.ModelForm):
    logo = forms.ImageField(
        label="Логотип *",
        required=True,
        help_text="Загрузите логотип стартапа (изображение)",
    )
    creatives = MultipleFileField(
        required=True, help_text="Загрузите изображения (до 3 файлов: PNG, JPEG)"
    )
    proofs = MultipleFileField(
        required=True, help_text="Загрузите документы (до 10 файлов: PDF, DOC, TXT)"
    )
    direction = forms.ModelChoiceField(
        queryset=Directions.objects.all(), label="Направление *", required=True
    )
    stage = forms.ModelChoiceField(
        queryset=StartupStages.objects.all(), label="Стадия *", required=True
    )
    agree_rules = forms.BooleanField(label="Согласен с правилами *", required=True)
    agree_data_processing = forms.BooleanField(
        label="Согласен с обработкой данных *", required=True
    )
    micro_investment_available = forms.BooleanField(
        required=False, label="Микроинвестиции доступны"
    )
    video = MultipleFileField(required=True, help_text="Загрузите видео (до 3 файлов: MP4, MOV)")
    short_description = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 3}), label="Вводная *", required=True
    )
    terms = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 5}), label="Условия *", required=True
    )
    planet_image = forms.ChoiceField(
        choices=[],
        label="Выберите планету *",
        required=True,
        widget=forms.HiddenInput(attrs={"id": "id_planet_image"}),
    )
    INVESTMENT_TYPE_CHOICES = [
        ("invest", "Инвестирование"),
        ("buy", "Выкуп"),
        ("both", "Инвестирование + Выкуп"),
    ]
    investment_type = forms.ChoiceField(
        choices=INVESTMENT_TYPE_CHOICES,
        label="Тип инвестирования *",
        required=True,
        widget=forms.Select(attrs={"class": "form-control"}),
    )
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            self.fields["planet_image"].choices = [(p, p) for p in get_planet_urls()]
        except Exception as e:
            print(f"Error fetching planet URLs: {e}")
            self.fields["planet_image"].choices = []
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
            "short_description": "Вводная *",
            "description": "Описание *",
            "terms": "Условия *",
            "funding_goal": "Цель финансирования (₽) *",
            "amount_raised": "Собранная сумма (₽)",
            "valuation": "Оценка (₽)",
            "pitch_deck_url": "URL презентации",
            "investment_type": "Тип инвестирования *",
            "direction": "Направление *",
            "stage": "Стадия *",
            "logo": "Логотип *",
            "creatives": "Изображения *",
            "video": "Видео *",
            "proofs": "Документы *",
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
        # Валидация количества изображений: от 1 до 3
        if len(cleaned_data.get("creatives", [])) == 0:
            self.add_error("creatives", "Загрузите хотя бы одно изображение (до 3 файлов).")
        elif len(cleaned_data.get("creatives", [])) > 3:
            self.add_error("creatives", "Можно прикрепить не более 3 изображений.")

        proofs = cleaned_data.get("proofs", [])
        if isinstance(proofs, list) and all(isinstance(item, list) for item in proofs):
            cleaned_data["proofs"] = [file for sublist in proofs for file in sublist]
        elif proofs and not isinstance(proofs, list):
            cleaned_data["proofs"] = [proofs]
        else:
            cleaned_data["proofs"] = proofs if proofs else []
        # Валидация количества документов: от 1 до 10
        if len(cleaned_data.get("proofs", [])) == 0:
            self.add_error("proofs", "Загрузите хотя бы один документ (до 10 файлов).")
        elif len(cleaned_data.get("proofs", [])) > 10:
            self.add_error("proofs", "Можно прикрепить не более 10 документов.")

        # Видео: MultipleFileField, от 1 до 3
        videos = cleaned_data.get("video", [])
        if isinstance(videos, list) and all(isinstance(item, list) for item in videos):
            cleaned_data["video"] = [file for sublist in videos for file in sublist]
        elif videos and not isinstance(videos, list):
            cleaned_data["video"] = [videos]
        else:
            cleaned_data["video"] = videos if videos else []

        if len(cleaned_data.get("video", [])) == 0:
            self.add_error("video", "Загрузите хотя бы одно видео (до 3 файлов).")
        elif len(cleaned_data.get("video", [])) > 3:
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
    creatives = MultipleFileField(required=True, help_text="Загрузите изображения (до 3 файлов: PNG, JPEG)")
    proofs = MultipleFileField(required=True, help_text="Загрузите документы (до 3 файлов: PDF, DOC, TXT)")
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
    video = forms.FileField(required=True, help_text="Загрузите видео (MP4, MOV)")
    short_description = forms.CharField(widget=forms.Textarea(attrs={"rows": 3}), label="Вводная *", required=True)
    terms = forms.CharField(widget=forms.Textarea(attrs={"rows": 5}), label="Условия *", required=True)
    planet_image = forms.ChoiceField(choices=[], label="Выберите планету", required=False, widget=forms.HiddenInput(attrs={"id": "id_planet_image"}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            self.fields["planet_image"].choices = [(p, p) for p in get_planet_urls()]
        except Exception as e:
            print(f"Error fetching planet URLs: {e}")
            self.fields["planet_image"].choices = []


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
            "profit_calculation",
        ]
        widgets = {
            "title": forms.TextInput(attrs={"class": "form-control", "placeholder": "Название франшизы"}),
            "short_description": forms.Textarea(attrs={"class": "form-control", "rows": 3, "placeholder": "Краткое описание франшизы"}),
            "description": forms.Textarea(attrs={"class": "form-control", "rows": 5, "placeholder": "Подробное описание франшизы"}),
            "terms": forms.Textarea(attrs={"class": "form-control", "rows": 5, "placeholder": "Условия сотрудничества"}),
            "investment_size": forms.NumberInput(attrs={"class": "form-control", "placeholder": "Введите сумму ₽"}),
            "franchise_cost": forms.NumberInput(attrs={"class": "form-control", "placeholder": "Стоимость франшизы ₽"}),

            "pitch_deck_url": forms.URLInput(attrs={"class": "form-control", "placeholder": "https://example.com"}),
            "direction": forms.Select(attrs={"class": "form-control"}),
            "logo": forms.FileInput(attrs={"class": "form-control-file"}),
            "profit_calculation": forms.Textarea(attrs={"class": "form-control", "rows": 5, "placeholder": "Описание расчета прибыли"}),
        }
        labels = {
            "title": "Название франшизы *",
            "short_description": "Вводная *",
            "description": "Описание *",
            "terms": "Условия *",
            "investment_size": "Размер инвестиций (₽)",
            "franchise_cost": "Стоимость франшизы (₽)",
            "pitch_deck_url": "URL презентации",
            "direction": "Категория *",
            "stage": "Стадия *",
            "logo": "Логотип *",
            "creatives": "Изображения *",
            "video": "Видео *",
            "proofs": "Документы *",
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
    creatives = MultipleFileField(required=True, help_text="Загрузите изображения (до 3 файлов: PNG, JPEG)")
    proofs = MultipleFileField(required=True, help_text="Загрузите документы (до 3 файлов: PDF, DOC, TXT)")
    direction = forms.ChoiceField(choices=[
        ("Веб-разработка", "Веб-разработка"),
        ("Мобильная разработка", "Мобильная разработка"),
        ("Дизайн", "Дизайн"),
        ("Маркетинг", "Маркетинг"),
        ("ИИ", "ИИ"),
        ("Брендинг", "Брендинг"),
        ("Видео и мультимедиа", "Видео и мультимедиа"),
    ], label="Категория *", required=True)

    agree_rules = forms.BooleanField(label="Согласен с правилами *", required=True)
    agree_data_processing = forms.BooleanField(label="Согласен с обработкой данных *", required=True)
    video = forms.FileField(required=True, help_text="Загрузите видео (MP4, MOV)")
    short_description = forms.CharField(widget=forms.Textarea(attrs={"rows": 3}), label="Вводная *", required=True)
    terms = forms.CharField(widget=forms.Textarea(attrs={"rows": 5}), label="Этапы работ *", required=True)
    planet_image = forms.ChoiceField(choices=[], label="Выберите планету", required=False, widget=forms.HiddenInput(attrs={"id": "id_planet_image"}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            self.fields["planet_image"].choices = [(p, p) for p in get_planet_urls()]
        except Exception as e:
            print(f"Error fetching planet URLs: {e}")
            self.fields["planet_image"].choices = []


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
            "short_description": "Вводная *",
            "description": "Описание *",
            "terms": "Этапы работ *",
            "pitch_deck_url": "URL презентации",
            "direction": "Категория *",
            "stage": "Стадия *",
            "logo": "Логотип *",
            "creatives": "Изображения *",
            "video": "Видео *",
            "proofs": "Документы *",
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
    creatives = MultipleFileField(required=True, help_text="Загрузите изображения (до 3 файлов: PNG, JPEG)")
    proofs = MultipleFileField(required=True, help_text="Загрузите документы (до 3 файлов: PDF, DOC, TXT)")
    direction = forms.ChoiceField(choices=[
        ("Веб-разработка", "Веб-разработка"),
        ("Мобильная разработка", "Мобильная разработка"),
        ("Дизайн", "Дизайн"),
        ("Маркетинг", "Маркетинг"),
        ("ИИ", "ИИ"),
        ("Брендинг", "Брендинг"),
        ("Видео и мультимедиа", "Видео и мультимедиа"),
    ], label="Категория *", required=True)

    agree_rules = forms.BooleanField(label="Согласен с правилами *", required=True)
    agree_data_processing = forms.BooleanField(label="Согласен с обработкой данных *", required=True)
    video = forms.FileField(required=True, help_text="Загрузите видео (MP4, MOV)")
    short_description = forms.CharField(widget=forms.Textarea(attrs={"rows": 3}), label="Вводная *", required=True)
    terms = forms.CharField(widget=forms.Textarea(attrs={"rows": 5}), label="Этапы работ *", required=True)
    additional_info = forms.CharField(widget=forms.Textarea(attrs={"rows": 5}), label="Услуги и кейсы", required=False)
    planet_image = forms.ChoiceField(choices=[], label="Выберите планету", required=False, widget=forms.HiddenInput(attrs={"id": "id_planet_image"}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        try:
            self.fields["planet_image"].choices = [(p, p) for p in get_planet_urls()]
        except Exception as e:
            print(f"Error fetching planet URLs: {e}")
            self.fields["planet_image"].choices = []

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
            "short_description": "Вводная *",
            "description": "Описание *",
            "terms": "Этапы работ *",
            "additional_info": "Услуги и кейсы",
            "pitch_deck_url": "URL презентации",
            "direction": "Категория *",
            "stage": "Стадия *",
            "logo": "Логотип *",
            "creatives": "Изображения *",
            "video": "Видео *",
            "proofs": "Документы *",
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
            ("investor", "Инвестор"),
            ("moderator", "Модератор"),
        ],
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label="Роли",
    )
class ProfileEditForm(forms.ModelForm):
    telegram = forms.CharField(max_length=100, required=False, label="Telegram")
    vk_url = forms.CharField(max_length=255, required=False, label="VK")
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
    email = forms.EmailField(label="Email")
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
