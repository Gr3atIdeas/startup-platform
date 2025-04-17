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


# Форма создания стартапа
class StartupForm(forms.ModelForm):
    logo = forms.ImageField(label='Логотип', required=False, help_text="Загрузите логотип стартапа (изображение)")
    creatives = MultipleFileField(label='Креативы', required=False, help_text="Загрузите креативы (множественные файлы: изображения или видео)")
    proofs = MultipleFileField(label='Пруфы', required=False, help_text="Загрузите пруфы (множественные файлы: PDF, DOC, TXT и т.д.)")
    direction = forms.ModelChoiceField(queryset=Directions.objects.all(), label='Направление', required=True)
    stage = forms.ModelChoiceField(queryset=StartupStages.objects.all(), label='Стадия', required=True)
    agree_rules = forms.BooleanField(label='Согласен с правилами', required=True)
    agree_data_processing = forms.BooleanField(label='Согласен с обработкой данных', required=True)
    micro_investment_available = forms.BooleanField(label='Включить микро-инвестиции', required=False)
    video = forms.FileField(required=False)  # Новое поле для видео

    class Meta:
        model = Startups
        fields = [
            'title', 'description', 'funding_goal', 'amount_raised', 'valuation', 'pitch_deck_url',
            'planet_top_color', 'planet_middle_color', 'planet_bottom_color', 'logo',
            'only_invest', 'only_buy', 'both_mode', 'direction', 'stage',
            'agree_rules', 'agree_data_processing', 'micro_investment_available',
            'creatives', 'proofs', 'video'  # Добавляем поля, чтобы форма их обрабатывала
        ]
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 5}),
            'funding_goal': forms.NumberInput(attrs={'class': 'form-control'}),
            'amount_raised': forms.NumberInput(attrs={'class': 'form-control'}),
            'valuation': forms.NumberInput(attrs={'class': 'form-control'}),
            'pitch_deck_url': forms.URLInput(attrs={'class': 'form-control'}),
            'planet_top_color': forms.TextInput(attrs={'type': 'color', 'class': 'color-picker'}),
            'planet_middle_color': forms.TextInput(attrs={'type': 'color', 'class': 'color-picker'}),
            'planet_bottom_color': forms.TextInput(attrs={'type': 'color', 'class': 'color-picker'}),
            'direction': forms.Select(attrs={'class': 'form-control'}),
            'stage': forms.Select(attrs={'class': 'form-control'}),
            'logo': forms.FileInput(attrs={'class': 'form-control-file'}),
        }
        labels = {
            'title': 'Название стартапа',
            'description': 'Описание',
            'funding_goal': 'Цель финансирования',
            'amount_raised': 'Собранная сумма',
            'valuation': 'Оценка',
            'pitch_deck_url': 'URL презентации',
            'planet_top_color': 'Цвет верха планеты',
            'planet_middle_color': 'Цвет середины планеты',
            'planet_bottom_color': 'Цвет низа планеты',
            'only_invest': 'Только инвестиции',
            'only_buy': 'Только выкуп',
            'both_mode': 'Оба варианта',
            'direction': 'Направление',
            'stage': 'Стадия',
        }

    def clean(self):
        cleaned_data = super().clean()
        only_invest = cleaned_data.get('only_invest', False)
        only_buy = cleaned_data.get('only_buy', False)
        both_mode = cleaned_data.get('both_mode', False)

        if not (only_invest or only_buy or both_mode):
            raise forms.ValidationError("Выберите хотя бы один режим: только инвестиции, только выкуп или оба варианта.")
        
        if both_mode and (only_invest or only_buy):
            cleaned_data['only_invest'] = False
            cleaned_data['only_buy'] = False

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
        choices=[('startup', 'Стартапер'), ('investor', 'Инвестор'), ('moderator', 'Модератор')],
        required=False,
        widget=forms.CheckboxSelectMultiple,
        label="Роли"
    )