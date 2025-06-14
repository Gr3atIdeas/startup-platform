from django import forms

from .models import Comments, Directions, Startups, StartupStages, Users
from .utils import get_planet_urls


# Кастомный виджет для загрузки нескольких файлов
class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True


# Кастомное поле для загрузки нескольких файлов
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


# Форма регистрации пользователя
class RegisterForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput, label="Пароль")
    confirm_password = forms.CharField(
        widget=forms.PasswordInput, label="Подтвердите пароль"
    )

    class Meta:
        model = Users
        fields = ["email", "first_name", "last_name", "phone", "role"]

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")
        if password != confirm_password:
            raise forms.ValidationError("Пароли не совпадают")
        return cleaned_data


# Форма входа пользователя
class LoginForm(forms.Form):
    email = forms.EmailField(label="Email")
    password = forms.CharField(widget=forms.PasswordInput, label="Пароль")


# Форма создания стартапа
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
        required=True, help_text="Загрузите документы (до 3 файлов: PDF, DOC, TXT)"
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
    video = forms.FileField(required=True, help_text="Загрузите видео (MP4, MOV)")
    short_description = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 3}), label="Вводная *", required=True
    )
    terms = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 5}), label="Условия *", required=True
    )
    planet_image = forms.ChoiceField(
        choices=[],  # Заполняется в __init__
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
            # Логгирование ошибки или обработка случая, когда S3 недоступен
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

        proofs = cleaned_data.get("proofs", [])
        if isinstance(proofs, list) and all(isinstance(item, list) for item in proofs):
            cleaned_data["proofs"] = [file for sublist in proofs for file in sublist]
        elif proofs and not isinstance(proofs, list):
            cleaned_data["proofs"] = [proofs]
        else:
            cleaned_data["proofs"] = proofs if proofs else []

        return cleaned_data

    def clean_title(self):
        title = self.cleaned_data.get("title")
        if not self.instance or not self.instance.pk:
            if Startups.objects.filter(title__iexact=title).exists():
                raise forms.ValidationError(
                    "Стартап с таким названием уже существует. Пожалуйста, выберите другое название."
                )
        else:
            if (
                Startups.objects.filter(title__iexact=title)
                .exclude(pk=self.instance.pk)
                .exists()
            ):
                raise forms.ValidationError(
                    "Другой стартап с таким названием уже существует. Пожалуйста, выберите другое название."
                )
        return title

    def clean(self):
        cleaned_data = super().clean()
        # Валидация для investment_type, если потребуется, может быть добавлена здесь.
        # Например, убедиться, что значение выбрано.
        # Но 'required=True' в определении поля уже это делает.

        # Убедимся, что creatives и proofs — это плоский список файлов
        if "creatives" in cleaned_data:
            # Если это список списков, распакуем его
            creatives = cleaned_data["creatives"]
            if (
                creatives
                and isinstance(creatives, list)
                and all(isinstance(item, list) for item in creatives)
            ):
                cleaned_data["creatives"] = [
                    file for sublist in creatives for file in sublist
                ]
            # Если это не список, обернём в список
            elif creatives and not isinstance(creatives, list):
                cleaned_data["creatives"] = [creatives]
            # Если пусто, оставим пустой список
            else:
                cleaned_data["creatives"] = creatives if creatives else []

        if "proofs" in cleaned_data:
            proofs = cleaned_data["proofs"]
            if (
                proofs
                and isinstance(proofs, list)
                and all(isinstance(item, list) for item in proofs)
            ):
                cleaned_data["proofs"] = [
                    file for sublist in proofs for file in sublist
                ]
            elif proofs and not isinstance(proofs, list):
                cleaned_data["proofs"] = [proofs]
            else:
                cleaned_data["proofs"] = proofs if proofs else []

        return cleaned_data


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comments
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
            ("investor", "Инвестор"),
            ("moderator", "Модератор"),
        ],
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label="Роли",
    )


class ProfileEditForm(forms.ModelForm):
    telegram = forms.CharField(
        max_length=50,
        required=False,
        label="Telegram",
        widget=forms.TextInput(attrs={"placeholder": "@username"}),
    )

    class Meta:
        model = Users
        fields = ["first_name", "last_name", "website_url", "bio"]
        widgets = {
            "first_name": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "Введите имя"}
            ),
            "last_name": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "Введите фамилию"}
            ),
            "website_url": forms.URLInput(
                attrs={"class": "form-control", "placeholder": "https://example.com"}
            ),
            "bio": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 5,
                    "placeholder": "Расскажите о себе",
                }
            ),
        }
        labels = {
            "first_name": "Имя",
            "last_name": "Фамилия",
            "website_url": "Портфолио или сайт",
            "bio": "О себе",
        }

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
