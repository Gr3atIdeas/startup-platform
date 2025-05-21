from django import forms
from .models import Users, Startups, Directions, StartupStages, ReviewStatuses, Comments

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
    confirm_password = forms.CharField(widget=forms.PasswordInput, label="Подтвердите пароль")

    class Meta:
        model = Users
        fields = ['email', 'first_name', 'last_name', 'phone', 'role']

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

# Форма редактирования профиля
class UserProfileForm(forms.ModelForm):
    class Meta:
        model = Users
        fields = ['first_name', 'last_name', 'bio', 'website_url', 'phone', 'show_phone', 'social_links']
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'profile-edit-input profile-edit-input-text', 'data-placeholder': 'Введите имя'}),
            'last_name': forms.TextInput(attrs={'class': 'profile-edit-input profile-edit-input-text', 'data-placeholder': 'Введите фамилию'}),
            'bio': forms.Textarea(attrs={'class': 'profile-edit-input profile-edit-input-textarea', 'data-placeholder': 'Расскажите о вас в нескольких предложениях'}),
            'website_url': forms.URLInput(attrs={'class': 'profile-edit-input profile-edit-input-text', 'data-placeholder': 'URL'}),
            'phone': forms.TextInput(attrs={'class': 'profile-edit-input profile-edit-input-text', 'data-placeholder': 'Введите телефон'}),
            'show_phone': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'social_links': forms.Textarea(attrs={'class': 'profile-edit-input profile-edit-input-textarea', 'data-placeholder': 'Социальные сети в формате JSON'}),
        }
        labels = {
            'first_name': 'Имя пользователя',
            'last_name': 'Фамилия',
            'bio': 'Обо мне',
            'website_url': 'Портфолио или сайт',
            'phone': 'Телефон',
            'show_phone': 'Показывать телефон другим пользователям',
            'social_links': 'Социальные сети (JSON)',
        }

    def clean_social_links(self):
        social_links = self.cleaned_data.get('social_links')
        if social_links:
            try:
                # Если передали строку, пытаемся её распарсить
                if isinstance(social_links, str):
                    social_links = json.loads(social_links)
                if not isinstance(social_links, dict):
                    raise forms.ValidationError("Социальные сети должны быть в формате JSON-объекта")
            except json.JSONDecodeError:
                raise forms.ValidationError("Неверный формат JSON для социальных сетей")
        return social_links

# Форма создания стартапа
class StartupForm(forms.ModelForm):
    logo = forms.ImageField(label='Логотип', required=False, help_text="Загрузите логотип стартапа (изображение)")
    creatives = MultipleFileField(required=False, help_text="Загрузите изображения (множественные файлы: PNG, JPEG)")
    proofs = MultipleFileField(required=False, help_text="Загрузите документы (множественные файлы: PDF, DOC, TXT и т.д.)")
    direction = forms.ModelChoiceField(queryset=Directions.objects.all(), label='Направление', required=True)
    stage = forms.ModelChoiceField(queryset=StartupStages.objects.all(), label='Стадия', required=True)
    agree_rules = forms.BooleanField(label='Согласен с правилами', required=True)
    agree_data_processing = forms.BooleanField(label='Согласен с обработкой данных', required=True)
    micro_investment_available = forms.BooleanField(required=False)
    video = forms.FileField(required=False, help_text="Загрузите основное видео (MP4, MOV)")
    short_description = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), label='Вводная (краткое описание)', required=False)
    terms = forms.CharField(widget=forms.Textarea(attrs={'rows': 5}), label='Условия', required=False)

    INVESTMENT_TYPE_CHOICES = [
        ('invest', 'Инвестирование'),
        ('buy', 'Выкуп'),
        ('both', 'Инвестирование + Выкуп'),
    ]
    investment_type = forms.ChoiceField(
        choices=INVESTMENT_TYPE_CHOICES,
        label='Тип инвестирования',
        required=True,
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    class Meta:
        model = Startups
        fields = [
            'title', 'short_description', 'description', 'terms', 'funding_goal', 'amount_raised', 'valuation', 'pitch_deck_url', 'logo',
            'direction', 'stage', 'investment_type',
            'agree_rules', 'agree_data_processing', 'micro_investment_available',
            'creatives', 'proofs', 'video'
        ]
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'short_description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Краткое описание стартапа (до 255 символов)'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 5, 'placeholder': 'Подробное описание стартапа'}),
            'terms': forms.Textarea(attrs={'class': 'form-control', 'rows': 5, 'placeholder': 'Условия сотрудничества, если есть'}),
            'funding_goal': forms.NumberInput(attrs={'class': 'form-control'}),
            'amount_raised': forms.NumberInput(attrs={'class': 'form-control'}),
            'valuation': forms.NumberInput(attrs={'class': 'form-control'}),
            'pitch_deck_url': forms.URLInput(attrs={'class': 'form-control', 'placeholder': 'https://example.com/presentation'}),
            'direction': forms.Select(attrs={'class': 'form-control'}),
            'stage': forms.Select(attrs={'class': 'form-control'}),
            'logo': forms.FileInput(attrs={'class': 'form-control-file'}),
        }
        labels = {
            'title': 'Название стартапа *',
            'short_description': 'Вводная *',
            'description': 'Описание *',
            'terms': 'Условия',
            'funding_goal': 'Цель финансирования (₽) *',
            'amount_raised': 'Собранная сумма (₽)',
            'valuation': 'Оценка (₽)',
            'pitch_deck_url': 'URL презентации',
            'investment_type': 'Тип инвестирования *',
            'direction': 'Направление *',
            'stage': 'Стадия *',
            'logo': 'Логотип',
            'creatives': 'Изображения',
            'video': 'Видео',
            'proofs': 'Документы',
            'micro_investment_available': 'Включить микро-инвестиции',
            'agree_rules': 'Согласен с правилами *',
            'agree_data_processing': 'Согласен с обработкой данных *',
        }

    def clean_title(self):
        title = self.cleaned_data.get('title')
        if not self.instance or not self.instance.pk: 
            if Startups.objects.filter(title__iexact=title).exists():
                raise forms.ValidationError("Стартап с таким названием уже существует. Пожалуйста, выберите другое название.")
        else:
            if Startups.objects.filter(title__iexact=title).exclude(pk=self.instance.pk).exists():
                raise forms.ValidationError("Другой стартап с таким названием уже существует. Пожалуйста, выберите другое название.")
        return title

    def clean(self):
        cleaned_data = super().clean()
        # Валидация для investment_type, если потребуется, может быть добавлена здесь.
        # Например, убедиться, что значение выбрано.
        # Но 'required=True' в определении поля уже это делает.

        # Убедимся, что creatives и proofs — это плоский список файлов
        if 'creatives' in cleaned_data:
            # Если это список списков, распакуем его
            creatives = cleaned_data['creatives']
            if creatives and isinstance(creatives, list) and all(isinstance(item, list) for item in creatives):
                cleaned_data['creatives'] = [file for sublist in creatives for file in sublist]
            # Если это не список, обернём в список
            elif creatives and not isinstance(creatives, list):
                cleaned_data['creatives'] = [creatives]
            # Если пусто, оставим пустой список
            else:
                cleaned_data['creatives'] = creatives if creatives else []

        if 'proofs' in cleaned_data:
            proofs = cleaned_data['proofs']
            if proofs and isinstance(proofs, list) and all(isinstance(item, list) for item in proofs):
                cleaned_data['proofs'] = [file for sublist in proofs for file in sublist]
            elif proofs and not isinstance(proofs, list):
                cleaned_data['proofs'] = [proofs]
            else:
                cleaned_data['proofs'] = proofs if proofs else []

        return cleaned_data
    
class CommentForm(forms.ModelForm):
    class Meta:
        model = Comments
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Напишите ваш комментарий...', 'class': 'form-control'}),
        }

class MessageForm(forms.Form):
    message_text = forms.CharField(widget=forms.Textarea(attrs={'rows': 2, 'placeholder': 'Введите сообщение...'}), label="Сообщение")

class UserSearchForm(forms.Form):
    query = forms.CharField(required=False, label="Поиск", widget=forms.TextInput(attrs={'placeholder': 'Поиск по имени или email...'}))
    roles = forms.MultipleChoiceField(
        choices=[('startuper', 'Стартапер'), ('investor', 'Инвестор'), ('moderator', 'Модератор')],
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label="Роли"
    )