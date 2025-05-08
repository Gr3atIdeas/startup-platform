# accounts/views.py
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.http import HttpResponse 
from django.core.files.storage import default_storage
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
import json
import logging
import os
from django.conf import settings
from django.db import models  # Добавляем для models.Q
from .forms import RegisterForm, LoginForm, StartupForm, CommentForm, MessageForm, UserSearchForm  # Добавляем MessageForm и UserSearchForm
from .models import Users, Directions, Startups, ReviewStatuses, UserVotes, StartupTimeline, FileStorage, EntityTypes, FileTypes, InvestmentTransactions, TransactionTypes, PaymentMethods, Comments, NewsArticles, NewsLikes, NewsViews, ChatConversations, ChatParticipants, Messages, MessageStatuses
from .models import creative_upload_path, proof_upload_path, video_upload_path
import uuid
from .models import Comments
from .forms import CommentForm
from django.db.models import Count, Sum, Avg, F, FloatField, Max, Min, Q # Добавляем Q
from decimal import Decimal
from .models import NewsArticles, NewsLikes, NewsViews  # Добавляем новые модели
from django.core.files.storage import default_storage  # Для работы с файлами
from django import forms  # Добавляем импорт
from django.core.paginator import Paginator
from django.template.loader import render_to_string
from django.db.models.functions import TruncMonth # Добавляем для группировки по месяцам
import datetime # Добавляем для работы с датами
from django.db.models.functions import Coalesce # Добавляем Coalesce
import collections # Добавляем для defaultdict
from dateutil.relativedelta import relativedelta


logger = logging.getLogger(__name__)

# Главная страница
def home(request):
    return render(request, 'accounts/home.html')

# Регистрация пользователя
def register(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password'])
            user.save()
            messages.success(request, 'Регистрация прошла успешно! Теперь вы можете войти.')
            return redirect('home')
        else:
            return render(request, 'accounts/register.html', {'form': form})
    else:
        form = RegisterForm()
    return render(request, 'accounts/register.html', {'form': form})

# Вход пользователя
def user_login(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            user = authenticate(
                request,
                email=form.cleaned_data['email'],
                password=form.cleaned_data['password']
            )
            if user is not None:
                login(request, user)
                messages.success(request, f'Добро пожаловать, {user.email}!')
                return redirect('home')
            else:
                messages.error(request, 'Неверный email или пароль.')
        return render(request, 'accounts/login.html', {'form': form})
    else:
        form = LoginForm()
    return render(request, 'accounts/login.html', {'form': form})

# Выход пользователя
def user_logout(request):
    logout(request)
    messages.success(request, 'Вы успешно вышли из системы.')
    return redirect('home')

def startups_list(request):
    # Получаем все направления из базы данных
    directions = Directions.objects.all()

    # Базовый запрос: только одобренные стартапы
    startups_qs = Startups.objects.filter(status='approved')

    # Получаем параметры фильтрации
    selected_categories = request.GET.getlist('category')
    micro_investment = request.GET.get('micro_investment') == '1'
    search_query = request.GET.get('search', '').strip()
    min_rating_str = request.GET.get('min_rating', '0')
    max_rating_str = request.GET.get('max_rating', '5')
    sort_order = request.GET.get('sort_order', 'newest')
    page_number = request.GET.get('page', 1)

    # Аннотируем базовые поля + средний рейтинг сразу
    startups_qs = startups_qs.annotate(
        comment_count=Count('comments'),
        average_rating=Avg(
            models.ExpressionWrapper(
                models.F('sum_votes') * 1.0 / models.F('total_voters'),
                output_field=FloatField()
            ),
            filter=models.Q(total_voters__gt=0)
        )
    ).annotate(
         average_rating=models.functions.Coalesce('average_rating', 0.0)
    )

    # Фильтрация по категориям
    if selected_categories:
        startups_qs = startups_qs.filter(direction__direction_name__in=selected_categories)

    # Фильтрация по микроинвестициям
    if micro_investment:
        startups_qs = startups_qs.filter(micro_investment_available=True)

    # Фильтрация по поисковому запросу
    if search_query:
        startups_qs = startups_qs.filter(title__icontains=search_query)

    # Фильтрация по диапазону рейтинга (применяем к аннотированному полю)
    try:
        min_rating = float(min_rating_str)
        max_rating = float(max_rating_str)
        if min_rating > 0:
            startups_qs = startups_qs.filter(average_rating__gte=min_rating)
        if max_rating < 5:
            startups_qs = startups_qs.filter(average_rating__lte=max_rating)
    except ValueError:
        min_rating = 0
        max_rating = 5

    # Сортировка
    if sort_order == 'newest':
        startups_qs = startups_qs.order_by('-created_at')
    elif sort_order == 'oldest':
        startups_qs = startups_qs.order_by('created_at')

    # Создаем пагинатор ПОСЛЕ всех фильтраций и сортировок
    paginator = Paginator(startups_qs, 6)
    page_obj = paginator.get_page(page_number)

    # Проверяем, AJAX ли это запрос
    is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'

    if is_ajax:
        # Рендерим только карточки стартапов
        html = render_to_string(
            'accounts/partials/_startup_cards.html',
            {'page_obj': page_obj}
        )
        # Возвращаем JSON
        return JsonResponse({
            'html': html,
            'has_next': page_obj.has_next(),
            'page_number': page_obj.number,
            'num_pages': paginator.num_pages,
            'count': paginator.count
        })
    else:
        # Обычный запрос, рендерим всю страницу
        context = {
            'page_obj': page_obj,
            'paginator': paginator,
            'initial_has_next': page_obj.has_next(),
            'selected_categories': selected_categories,
            'micro_investment': micro_investment,
            'search_query': search_query,
            'min_rating': min_rating,
            'max_rating': max_rating,
            'sort_order': sort_order,
            'directions': directions,
        }
        return render(request, 'accounts/startups_list.html', context)

def search_suggestions(request):
    query = request.GET.get('q', '').strip()
    suggestions = []
    if query:
        startups = Startups.objects.filter(status='approved', title__icontains=query)[:5]  # Ограничиваем до 5 предложений
        suggestions = [startup.title for startup in startups]
    return JsonResponse({'suggestions': suggestions})

def startup_detail(request, startup_id):
    startup = get_object_or_404(Startups, startup_id=startup_id)
    timeline = StartupTimeline.objects.filter(startup=startup)
    average_rating = startup.sum_votes / startup.total_voters if startup.total_voters > 0 else 0
    # Аннотируем рейтинг пользователя к каждому комментарию
    comments = Comments.objects.filter(startup_id=startup).annotate(
        user_rating=models.Subquery(
            UserVotes.objects.filter(
                startup=models.OuterRef('startup_id'), 
                user=models.OuterRef('user_id')
            ).values('rating')[:1]
        )
    ).order_by('-created_at')
    investors_count = startup.get_investors_count()
    progress_percentage = startup.get_progress_percentage()

    # --- Расчет распределения голосов --- 
    rating_distribution = UserVotes.objects.filter(startup=startup)\
                                         .values('rating')\
                                         .annotate(count=Count('rating'))\
                                         .order_by('-rating')
    # Преобразуем в удобный словарь {5: count5, 4: count4, ...}
    rating_distribution_dict = {item['rating']: item['count'] for item in rating_distribution}
    # Дополняем нулями для тех оценок, которых нет
    for i in range(1, 6):
        rating_distribution_dict.setdefault(i, 0)
    # --- Конец расчета --- 

    # ---> Добавляем расчет максимального количества голосов <--- 
    max_rating_count = 0
    if rating_distribution_dict: # Проверяем, что словарь не пустой
        max_rating_count = max(rating_distribution_dict.values()) if rating_distribution_dict else 0
    # ---> Конец добавления <--- 

    # ---> Рассчитываем общее количество голосов <--- 
    total_votes_count = sum(rating_distribution_dict.values())
    # ---> Конец расчета <--- 

    # --- Получаем похожие стартапы --- 
    similar_startups = Startups.objects.filter(
        status='approved' # Только одобренные
    ).exclude(
        startup_id=startup_id # Исключаем текущий
    ).order_by('?')[:5] # Берем 5 случайных
    # Примечание: .order_by('?') может быть медленным на больших таблицах
    # Возможно, в будущем понадобится более сложная логика (по категории, тегам и т.д.)

    # ---> Добавляем аннотацию рейтинга для похожих стартапов <--- 
    similar_startups = similar_startups.annotate(
        average_rating_calc=Avg(
            models.ExpressionWrapper(
                models.F('sum_votes') * 1.0 / models.F('total_voters'),
                output_field=FloatField()
            ),
            filter=models.Q(total_voters__gt=0)
        )
    ).annotate(
         average_rating=Coalesce('average_rating_calc', 0.0)
    )
    # ---> Конец добавления <--- 

    user_has_voted = False
    can_invest = False
    if request.user.is_authenticated:
        user_has_voted = UserVotes.objects.filter(user=request.user, startup=startup).exists()
        can_invest = request.user.role.role_name == 'investor'

    if request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role.role_name == 'moderator':
        # Обработка изменения статуса
        if request.method == 'POST' and 'status' in request.POST:
            new_status = request.POST.get('status')
            if new_status in ['approved', 'blocked', 'closed']:
                startup.status = new_status
                startup.status_id = ReviewStatuses.objects.get(status_name=new_status.capitalize())
                startup.save()
                messages.success(request, f'Статус стартапа изменён на "{new_status.capitalize()}".')
                return redirect('startup_detail', startup_id=startup_id)

        # Обработка одобрения/отклонения для статуса pending
        if request.method == 'POST' and 'moderator_comment' in request.POST:
            comment = request.POST.get('moderator_comment', '')
            action = request.POST.get('action', '')
            if action == 'approve':
                startup.moderator_comment = comment
                startup.status = 'approved'
                startup.status_id = ReviewStatuses.objects.get(status_name='Approved')
                startup.save()
                messages.success(request, 'Стартап одобрен.')
                return redirect('startup_detail', startup_id=startup_id)
            elif action == 'reject':
                startup.moderator_comment = comment
                startup.status = 'rejected'
                startup.status_id = ReviewStatuses.objects.get(status_name='Rejected')
                startup.save()
                messages.success(request, 'Стартап отклонен.')
                return redirect('startup_detail', startup_id=startup_id)

    if request.method == 'POST' and request.user.is_authenticated and 'content' in request.POST:
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.startup_id = startup
            comment.user_id = request.user
            comment.save()
            return redirect('startup_detail', startup_id=startup_id)
    else:
        form = CommentForm()

    show_moderator_comment = False
    if request.user.is_authenticated:
        if (hasattr(request.user, 'role') and request.user.role.role_name == 'moderator') or request.user == startup.owner:
            show_moderator_comment = True

    return render(request, 'accounts/startup_detail.html', {
        'startup': startup,
        'logo_urls': startup.logo_urls or [],
        'creatives_urls': startup.creatives_urls or [],
        'proofs_urls': startup.proofs_urls or [],
        'video_urls': startup.video_urls or [],
        'timeline': timeline,
        'average_rating': average_rating,
        'direction_name': startup.direction.direction_name if startup.direction else 'Не указано',
        'stage_name': startup.stage.stage_name if startup.stage else 'Не указано',
        'owner_email': startup.owner.email if startup.owner else 'Не указано',
        'comments': comments,
        'form': form,
        'show_moderator_comment': show_moderator_comment,
        'user_has_voted': user_has_voted,
        'can_invest': can_invest,
        'investors_count': investors_count,
        'progress_percentage': progress_percentage,
        'similar_startups': similar_startups, # <-- Добавляем похожие стартапы в контекст
        'rating_distribution': rating_distribution_dict, # <-- Добавляем распределение рейтинга
        'max_rating_count': max_rating_count, # <-- Передаем максимальное количество
        'total_votes_count': total_votes_count # <-- Передаем общее количество голосов
    })

# Новая view-функция для AJAX-запроса похожих стартапов
def load_similar_startups(request, startup_id: int): # <-- Явно указываем тип int
    # Получаем ID текущего стартапа, чтобы исключить его
    current_startup_id = startup_id

    # Запрашиваем 4 случайных одобренных стартапа, исключая текущий
    similar_startups = Startups.objects.filter(
        status='approved'
    ).exclude(
        startup_id=current_startup_id
    ).order_by('?')[:4] # Берем 4 случайных

    # Аннотируем средний рейтинг для похожих стартапов
    # Убедимся, что используем правильные импорты и аннотации
    similar_startups = similar_startups.annotate(
        average_rating_calc=Avg(
            models.ExpressionWrapper(
                models.F('sum_votes') * 1.0 / models.F('total_voters'),
                output_field=FloatField()
            ),
            filter=models.Q(total_voters__gt=0)
        )
    ).annotate(
         average_rating=Coalesce('average_rating_calc', 0.0)
    )

    # Рендерим HTML для карточек
    # Используем правильный путь к шаблону
    html = render_to_string(
        'accounts/_similar_startup_cards.html',
        {'similar_startups': similar_startups, 'request': request} 
    )

    return HttpResponse(html)

# Страница инвестиций
@login_required
def investments(request):
    # Дополнительная проверка на роль инвестора
    if not hasattr(request.user, 'role') or request.user.role.role_name != 'investor':
        messages.error(request, 'Доступ к этой странице разрешен только инвесторам.')
        return redirect('home')

    # Базовый запрос без аннотаций рейтинга/комментов, которые могут дублировать строки
    base_investments_qs = InvestmentTransactions.objects.filter(
        investor=request.user,
        transaction_type__type_name='investment'
    ).select_related('startup', 'startup__direction', 'startup__owner')

    # Агрегированные данные для аналитики (применяем distinct() ПЕРЕД агрегацией)
    analytics_data = base_investments_qs.distinct().aggregate(
        total_investment=Sum('amount'),
        max_investment=Max('amount'),
        min_investment=Min('amount'),
        startups_count=Count('startup', distinct=True)
    )

    # Получаем общую сумму инвестиций отдельно
    total_investment_decimal = analytics_data.get('total_investment') or Decimal('0')
    # >>> ЛОГГИРОВАНИЕ ОБЩЕЙ СУММЫ
    logger.info(f"[investments view] User: {request.user.email}, Total Investment Calculated (after distinct): {total_investment_decimal}")

    # Данные по категориям (применяем distinct() ПЕРЕД values/annotate)
    category_data_raw = base_investments_qs.distinct().values(
        'startup__direction__direction_name'
    ).annotate(
        category_total=Sum('amount')
    ).order_by('-category_total')

    # Формируем данные для радиальных диаграмм, РАССЧИТЫВАЯ ПРОЦЕНТЫ
    investment_categories = []
    invested_category_data_dict = {} # Для модального окна
    
    # Используем total_investment_decimal для расчета процентов
    total_for_percentage = total_investment_decimal if total_investment_decimal > 0 else Decimal('1') # Избегаем деления на ноль

    for cat_data in category_data_raw:
        percentage = 0
        category_sum = cat_data.get('category_total')
        category_name = cat_data.get('startup__direction__direction_name') or 'Без категории'
        
        # >>> ЛОГГИРОВАНИЕ СУММ ПО КАТЕГОРИЯМ (примерно)
        if investment_categories == []: # Логгируем только первый раз
             logger.info(f"[investments view] Raw category data example (after distinct): {list(category_data_raw[:2])}") # Логгируем список

        if category_sum and total_for_percentage > 0:
            try:
                # Расчет процента
                percentage = round((Decimal(category_sum) / total_for_percentage) * 100)
                percentage = min(percentage, 100) # Ограничиваем сверху 100%
            except Exception as e:
                logger.error(f"Ошибка расчета процента для категории '{category_name}': {e}")
                percentage = 0
        
        investment_categories.append({
            'name': category_name,
            'percentage': percentage,
        })
        invested_category_data_dict[category_name] = percentage # Сохраняем для модалки

    # --- Данные для графика по месяцам (НОВЫЙ НЕЗАВИСИМЫЙ ЗАПРОС + distinct) ---
    current_year = timezone.now().year
    monthly_data_direct = InvestmentTransactions.objects.filter(
        investor=request.user,
        transaction_type__type_name='investment',
        created_at__year=current_year
    ).distinct().annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        monthly_total=Sum('amount')
    ).order_by('month')
    # >>> ЛОГГИРОВАНИЕ МЕСЯЧНЫХ ДАННЫХ
    logger.info(f"[investments view] Monthly data calculated (after distinct): {list(monthly_data_direct)}")

    # Подготовка данных для Chart.js
    month_labels = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
    monthly_totals = [0] * 12
    for data in monthly_data_direct: # Используем новый queryset
        month_index = data['month'].month - 1 # Месяцы 1-12 -> индексы 0-11
        if 0 <= month_index < 12:
            monthly_totals[month_index] = float(data.get('monthly_total', 0) or 0) # Добавил .get()
    # >>> ЛОГГИРОВАНИЕ ИТОГОВЫХ ДАННЫХ ДЛЯ ГРАФИКА
    logger.info(f"[investments view] Final monthly totals for chart (after distinct): {monthly_totals}")
    # --- Конец данных для графика ---

    # --- Получаем QuerySet со всеми данными для передачи в шаблон ---
    # Теперь добавляем аннотации рейтинга/комментов к базовому QS
    user_investments_qs_final = base_investments_qs.annotate(
         startup_average_rating=Avg(
            models.ExpressionWrapper(
                models.F('startup__sum_votes') * 1.0 / models.F('startup__total_voters'),
                output_field=FloatField()
            ),
            filter=models.Q(startup__total_voters__gt=0),
            default=0.0 # Значение по умолчанию, если нет голосов
        ),
        # Аннотируем количество комментариев (предполагая связь 'comments' в модели Startups)
        startup_comment_count=Count('startup__comments', distinct=True)
    ).annotate(
         average_rating=models.functions.Coalesce('startup_average_rating', 0.0)
    )

    # <<< ДОБАВЛЯЕМ СОРТИРОВКУ >>>
    sort_param = request.GET.get('sort', 'newest') # По умолчанию - новые
    if sort_param == 'oldest':
        user_investments_qs_final = user_investments_qs_final.order_by('created_at')
    else: # newest или любой другой параметр
        user_investments_qs_final = user_investments_qs_final.order_by('-created_at')
    # <<< КОНЕЦ СОРТИРОВКИ >>>

    # --- Данные для модального окна категорий ---
    all_directions_qs = Directions.objects.all().order_by('direction_name')
    # Преобразуем QuerySet в список словарей для JSON
    all_directions_list = list(all_directions_qs.values('pk', 'direction_name'))
    # all_directions_json_string = json.dumps(all_directions_list) # Убираем ручную сериализацию

    # >>> ЛОГГИРОВАНИЕ ДАННЫХ СТАРТАПОВ ПЕРЕД КОНТЕКСТОМ
    try:
        logger.info(f"[investments view] Checking startup data for user {request.user.email}:")
        for inv in user_investments_qs_final[:3]: # Проверяем первые 3 инвестиции
            startup_info = "Startup object exists" if inv.startup else "!!! Startup object IS MISSING !!!"
            startup_name = f"Name: '{inv.startup.name}'" if inv.startup and hasattr(inv.startup, 'name') else "Name: attribute missing or startup is None"
            logger.info(f"  Investment ID: {inv.transaction_id}, {startup_info}, {startup_name}")
    except Exception as e:
        logger.error(f"[investments view] Error logging startup data: {e}")

    context = {
        'user_investments': user_investments_qs_final, # <<< Передаем QS с аннотациями
        'startups_count': analytics_data.get('startups_count', 0),
        'total_investment': total_investment_decimal, # Передаем Decimal
        'max_investment': analytics_data.get('max_investment', 0),
        'min_investment': analytics_data.get('min_investment', 0),
        'investment_categories': investment_categories[:7], # Оставляем топ-7 для радиальных диаграмм
        'month_labels': month_labels,
        'month_data': monthly_totals,
        'all_directions': all_directions_list,
        'invested_category_data': invested_category_data_dict, # Передаем обновленный словарь
        'current_sort': sort_param, # Передаем текущую сортировку для выделения активной кнопки
    }
    # context['month_labels'] = json.dumps(month_labels) # УДАЛЯЕМ - json_script сделает это сам
    # context['month_data'] = json.dumps(monthly_totals) # УДАЛЯЕМ - json_script сделает это сам
    # context['all_directions'] = json.dumps(all_directions_list) # УДАЛЯЕМ - json_script сделает это сам
    # context['invested_category_data'] = json.dumps(invested_category_data_dict) # УДАЛЯЕМ - json_script сделает это сам

    return render(request, 'accounts/investments.html', context)

# Страница юридической информации
def legal(request):
    return render(request, 'accounts/legal.html')

# accounts/views.py
def profile(request, user_id=None):
    if not request.user.is_authenticated:
        messages.error(request, 'Пожалуйста, войдите в систему, чтобы просмотреть профиль.')
        return redirect('login')

    # Если передан user_id, показываем профиль этого пользователя
    if user_id:
        profile_user = get_object_or_404(Users, user_id=user_id)
    else:
        profile_user = request.user

    # Если запрос через AJAX для профиля
    if request.GET.get('user_id'):
        user = get_object_or_404(Users, user_id=request.GET.get('user_id'))
        return JsonResponse({
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role.role_name if user.role else 'Неизвестно',
            'rating': float(user.rating) if user.rating else None,
            'bio': user.bio,
            'profile_picture_url': user.profile_picture_url
        })

    # Обработка загрузки аватара (доступно только для своего профиля)
    if request.method == 'POST' and 'avatar' in request.FILES and profile_user == request.user:
        avatar = request.FILES['avatar']
        filename = f'avatars/user_{request.user.user_id}_avatar{os.path.splitext(avatar.name)[1]}'
        file_path = default_storage.save(filename, avatar)
        request.user.profile_picture_url = default_storage.url(file_path)
        request.user.save()
        messages.success(request, 'Аватарка успешно загружена!')

    return render(request, 'accounts/profile.html', {'user': profile_user, 'is_own_profile': profile_user == request.user})

@login_required
def create_startup(request):
    if request.method == 'POST':
        form = StartupForm(request.POST, request.FILES)
        if form.is_valid():
            startup = form.save(commit=False)
            startup.owner = request.user
            startup.created_at = timezone.now()
            startup.updated_at = timezone.now()
            startup.status = 'pending'
            try:
                startup.status_id = ReviewStatuses.objects.get(status_name='Pending')
            except ReviewStatuses.DoesNotExist:
                raise ValueError("Статус 'Pending' не найден в базе данных.")
            
            # Обработка типа инвестирования
            investment_type = form.cleaned_data.get('investment_type')
            if investment_type == 'invest':
                startup.only_invest = True
                startup.only_buy = False
                startup.both_mode = False
            elif investment_type == 'buy':
                startup.only_invest = False
                startup.only_buy = True
                startup.both_mode = False
            elif investment_type == 'both':
                startup.only_invest = False # или True, в зависимости от вашей логики, если 'both' подразумевает и то, и другое
                startup.only_buy = False    # или True
                startup.both_mode = True

            # Устанавливаем текущий шаг из формы
            startup.step_number = int(request.POST.get('step_number', 1))
            startup.save() # Сохраняем основные данные стартапа, включая short_description и terms

            # Сохранение всех 5 этапов таймлайна
            for i in range(1, 6):
                description = request.POST.get(f'step_description_{i}', '').strip()
                if description:  # Сохраняем только этапы с описанием
                    StartupTimeline.objects.create(
                        startup=startup,
                        step_number=i,
                        title=f"Этап {i}",
                        description=description
                    )

            # Инициализация списков для ID файлов
            logo_ids = []
            creatives_ids = []
            proofs_ids = []
            video_ids = []

            # Сохранение логотипа
            logo = form.cleaned_data.get('logo')
            if logo:
                logo_id = str(uuid.uuid4())
                file_path = f"startups/{startup.startup_id}/logos/{logo_id}_{logo.name}"
                default_storage.save(file_path, logo)
                logo_ids.append(logo_id)
                logger.info(f"Логотип сохранён с ID: {logo_id}")

            # Сохранение креативов
            creatives = form.cleaned_data.get('creatives', [])
            if creatives:
                creative_type = FileTypes.objects.get(type_name='creative')
                entity_type = EntityTypes.objects.get(type_name='startup')
                for creative_file in creatives:
                    if not hasattr(creative_file, 'name'):
                        logger.warning(f"Пропущен креатив, так как это не файл: {creative_file}")
                        continue
                    creative_id = str(uuid.uuid4())
                    file_path = f"startups/{startup.startup_id}/creatives/{creative_id}_{creative_file.name}"
                    default_storage.save(file_path, creative_file)
                    creatives_ids.append(creative_id)
                    file_storage = FileStorage(
                        entity_type=entity_type,
                        entity_id=startup.startup_id,
                        file_type=creative_type,
                        file_url=creative_id,
                        uploaded_at=timezone.now(),
                        startup=startup
                    )
                    file_storage.save()
                    logger.info(f"Креатив сохранён с ID: {creative_id}")

            # Сохранение пруфов
            proofs = form.cleaned_data.get('proofs', [])
            if proofs:
                proof_type = FileTypes.objects.get(type_name='proof')
                entity_type = EntityTypes.objects.get(type_name='startup')
                for proof_file in proofs:
                    if not hasattr(proof_file, 'name'):
                        logger.warning(f"Пропущен пруф, так как это не файл: {proof_file}")
                        continue
                    proof_id = str(uuid.uuid4())
                    file_path = f"startups/{startup.startup_id}/proofs/{proof_id}_{proof_file.name}"
                    default_storage.save(file_path, proof_file)
                    proofs_ids.append(proof_id)
                    file_storage = FileStorage(
                        entity_type=entity_type,
                        entity_id=startup.startup_id,
                        file_type=proof_type,
                        file_url=proof_id,
                        uploaded_at=timezone.now(),
                        startup=startup
                    )
                    file_storage.save()
                    logger.info(f"Пруф сохранён с ID: {proof_id}")

            # Сохранение видео
            video = form.cleaned_data.get('video')
            if video:
                video_id = str(uuid.uuid4())
                file_path = f"startups/{startup.startup_id}/videos/{video_id}_{video.name}"
                default_storage.save(file_path, video)
                video_ids.append(video_id)
                video_type, _ = FileTypes.objects.get_or_create(type_name='video')
                entity_type = EntityTypes.objects.get(type_name='startup')
                file_storage = FileStorage(
                    entity_type=entity_type,
                    entity_id=startup.startup_id,
                    file_type=video_type,
                    file_url=video_id,
                    uploaded_at=timezone.now(),
                    startup=startup
                )
                file_storage.save()
                logger.info(f"Видео сохранено с ID: {video_id}")

            # Сохранение списков ID в поля jsonb
            startup.logo_urls = logo_ids
            startup.creatives_urls = creatives_ids
            startup.proofs_urls = proofs_ids
            startup.video_urls = video_ids
            startup.save()

            # Логирование (оставлено без изменений)
            logger.info("=== Отправка стартапа на модерацию ===")
            logger.info(f"Стартап ID: {startup.startup_id}")
            if logo:
                logger.info(f"Логотип: {logo.name}, размер: {logo.size} байт")
                logger.info(f"ID логотипа: {logo_ids[0] if logo_ids else 'Не сохранён'}")
            else:
                logger.info("Логотип не загружен")
            if creatives:
                logger.info(f"Креативы: {len(creatives)} файлов")
                for i, creative_file in enumerate(creatives, 1):
                    if hasattr(creative_file, 'name'):
                        logger.info(f"Креатив {i}: {creative_file.name}, размер: {creative_file.size} байт")
                    else:
                        logger.info(f"Креатив {i}: Неверный формат (не файл): {creative_file}")
            else:
                logger.info("Креативы не загружены")
            if proofs:
                logger.info(f"Пруфы: {len(proofs)} файлов")
                for i, proof_file in enumerate(proofs, 1):
                    if hasattr(proof_file, 'name'):
                        logger.info(f"Пруф {i}: {proof_file.name}, размер: {proof_file.size} байт")
                    else:
                        logger.info(f"Пруф {i}: Неверный формат (не файл): {proof_file}")
            else:
                logger.info("Пруфы не загружены")
            if video:
                logger.info(f"Видео: {video.name}, размер: {video.size} байт")
                logger.info(f"ID видео: {video_ids[0] if video_ids else 'Не сохранён'}")
            else:
                logger.info("Видео не загружено")
            logger.info("=== Переменные окружения ===")
            for key, value in os.environ.items():
                logger.info(f"{key}: {value}")
            logger.info("=== Настройки Yandex Object Storage ===")
            logger.info(f"AWS_ACCESS_KEY_ID: {getattr(settings, 'AWS_ACCESS_KEY_ID', 'Не задано')}")
            logger.info(f"AWS_SECRET_ACCESS_KEY: {getattr(settings, 'AWS_SECRET_ACCESS_KEY', 'Не задано')}")
            logger.info(f"AWS_STORAGE_BUCKET_NAME: {getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'Не задано')}")
            logger.info(f"AWS_S3_ENDPOINT_URL: {getattr(settings, 'AWS_S3_ENDPOINT_URL', 'Не задано')}")
            logger.info(f"AWS_DEFAULT_ACL: {getattr(settings, 'AWS_DEFAULT_ACL', 'Не задано')}")
            logger.info("=== Проверка STORAGES ===")
            logger.info(f"STORAGES['default']['BACKEND']: {settings.STORAGES['default']['BACKEND']}")
            logger.info(f"default_storage: {default_storage.__class__.__name__}")
            logger.info("=== Проверка подключения к Yandex Object Storage ===")
            try:
                from storages.backends.s3boto3 import S3Boto3Storage
                from django.core.files.base import ContentFile
                storage = S3Boto3Storage()
                test_file_name = f"test/test_file_{startup.startup_id}.txt"
                test_content = "This is a test file to check Yandex Object Storage connection."
                test_file = ContentFile(test_content.encode('utf-8'))
                storage.save(test_file_name, test_file)
                logger.info(f"Тестовый файл успешно сохранён: {test_file_name}")
                test_file_url = storage.url(test_file_name)
                logger.info(f"URL тестового файла: {test_file_url}")
                storage.delete(test_file_name)
                logger.info(f"Тестовый файл удалён: {test_file_name}")
            except Exception as e:
                logger.error(f"Ошибка подключения к Yandex Object Storage: {str(e)}", exc_info=True)

            messages.success(request, f'Стартап "{startup.title}" успешно создан и отправлен на модерацию!')
            return redirect('startup_creation_success') # <--- ИЗМЕНЕНО ЗДЕСЬ
        else:
            messages.error(request, 'Форма содержит ошибки.')
            # Здесь оставляем render, чтобы показать ошибки на той же странице
            return render(request, 'accounts/create_startup.html', {'form': form, 'timeline_steps': request.POST})
    else:
        form = StartupForm()
    return render(request, 'accounts/create_startup.html', {'form': form})

# Новая view-функция для страницы успеха
@login_required
def startup_creation_success(request):
    return render(request, 'accounts/templates/accounts/startup_creation_success.html')

# accounts/views.py
@login_required
def edit_startup(request, startup_id):
    logger.debug(f"Request method: {request.method}")
    logger.debug(f"Request POST: {request.POST}")
    logger.debug(f"Request FILES: {dict(request.FILES)}")
    
    startup = get_object_or_404(Startups, startup_id=startup_id)
    if request.user != startup.owner:
        messages.error(request, 'У вас нет прав для редактирования этого стартапа.')
        return redirect('startup_detail', startup_id=startup_id)

    # Получаем таймлайн стартапа
    timeline = StartupTimeline.objects.filter(startup=startup)
    # Создаём словарь с описаниями этапов (step_number: description)
    timeline_steps = {step.step_number: step.description for step in timeline}

    if request.method == 'POST':
        form = StartupForm(request.POST, request.FILES, instance=startup)
        if form.is_valid():
            startup = form.save(commit=False)
            startup.status = 'pending'
            startup.is_edited = True
            startup.updated_at = timezone.now()
            if 'step_number' in request.POST:
                new_step = int(request.POST.get('step_number'))
                startup.step_number = new_step

            # Обработка типа инвестирования
            investment_type = form.cleaned_data.get('investment_type')
            if investment_type == 'invest':
                startup.only_invest = True
                startup.only_buy = False
                startup.both_mode = False
            elif investment_type == 'buy':
                startup.only_invest = False
                startup.only_buy = True
                startup.both_mode = False
            elif investment_type == 'both':
                startup.only_invest = False
                startup.only_buy = False
                startup.both_mode = True

            startup.save()

            # Обновление или создание этапов таймлайна
            for i in range(1, 6):
                description = request.POST.get(f'step_description_{i}', '').strip()
                if description:
                    timeline_entry, created = StartupTimeline.objects.get_or_create(
                        startup=startup,
                        step_number=i,
                        defaults={'title': f"Этап {i}", 'description': description}
                    )
                    if not created and timeline_entry.description != description:
                        timeline_entry.description = description
                        timeline_entry.save()

            # Инициализация списков для ID
            logo_ids = startup.logo_urls or []
            creatives_ids = startup.creatives_urls or []
            proofs_ids = startup.proofs_urls or []
            video_ids = startup.video_urls or []

            # Сохранение логотипа
            logo = form.cleaned_data.get('logo')
            if logo:
                logo_id = str(uuid.uuid4())
                file_path = f"startups/{startup.startup_id}/logos/{logo_id}_{logo.name}"
                default_storage.save(file_path, logo)
                logo_ids = [logo_id]
                logger.info(f"Логотип сохранён с ID: {logo_id}")

            # Сохранение креативов
            creatives = form.cleaned_data.get('creatives', [])
            if creatives:
                creative_type = FileTypes.objects.get(type_name='creative')
                entity_type = EntityTypes.objects.get(type_name='startup')
                creatives_ids = []
                for creative_file in creatives:
                    if not hasattr(creative_file, 'name'):
                        logger.warning(f"Пропущен креатив, так как это не файл: {creative_file}")
                        continue
                    creative_id = str(uuid.uuid4())
                    file_path = f"startups/{startup.startup_id}/creatives/{creative_id}_{creative_file.name}"
                    default_storage.save(file_path, creative_file)
                    creatives_ids.append(creative_id)
                    file_storage = FileStorage(
                        entity_type=entity_type,
                        entity_id=startup.startup_id,
                        file_type=creative_type,
                        file_url=creative_id,
                        uploaded_at=timezone.now(),
                        startup=startup
                    )
                    file_storage.save()
                    logger.info(f"Креатив сохранён с ID: {creative_id}")

            # Сохранение пруфов
            proofs = form.cleaned_data.get('proofs', [])
            if proofs:
                proof_type = FileTypes.objects.get(type_name='proof')
                entity_type = EntityTypes.objects.get(type_name='startup')
                proofs_ids = []
                for proof_file in proofs:
                    if not hasattr(proof_file, 'name'):
                        logger.warning(f"Пропущен пруф, так как это не файл: {proof_file}")
                        continue
                    proof_id = str(uuid.uuid4())
                    file_path = f"startups/{startup.startup_id}/proofs/{proof_id}_{proof_file.name}"
                    default_storage.save(file_path, proof_file)
                    proofs_ids.append(proof_id)
                    file_storage = FileStorage(
                        entity_type=entity_type,
                        entity_id=startup.startup_id,
                        file_type=proof_type,
                        file_url=proof_id,
                        uploaded_at=timezone.now(),
                        startup=startup
                    )
                    file_storage.save()
                    logger.info(f"Пруф сохранён с ID: {proof_id}")

            # Сохранение видео
            video = form.cleaned_data.get('video')
            if video:
                video_id = str(uuid.uuid4())
                file_path = f"startups/{startup.startup_id}/videos/{video_id}_{video.name}"
                default_storage.save(file_path, video)
                video_ids = [video_id]
                video_type, _ = FileTypes.objects.get_or_create(type_name='video')
                entity_type = EntityTypes.objects.get(type_name='startup')
                file_storage = FileStorage(
                    entity_type=entity_type,
                    entity_id=startup.startup_id,
                    file_type=video_type,
                    file_url=video_id,
                    uploaded_at=timezone.now(),
                    startup=startup
                )
                file_storage.save()
                logger.info(f"Видео сохранено с ID: {video_id}")

            # Сохранение списков ID в поля jsonb
            startup.logo_urls = logo_ids
            startup.creatives_urls = creatives_ids
            startup.proofs_urls = proofs_ids
            startup.video_urls = video_ids
            startup.save()

            # Логирование
            logger.info("=== Обновление стартапа ===")
            logger.info(f"Стартап ID: {startup.startup_id}")
            if logo:
                logger.info(f"Логотип: {logo.name}, размер: {logo.size} байт")
                logger.info(f"ID логотипа: {logo_ids[0] if logo_ids else 'Не сохранён'}")
            else:
                logger.info("Логотип не загружен")
            if creatives:
                logger.info(f"Креативы: {len(creatives)} файлов")
                for i, creative_file in enumerate(creatives, 1):
                    if hasattr(creative_file, 'name'):
                        logger.info(f"Креатив {i}: {creative_file.name}, размер: {creative_file.size} байт")
                    else:
                        logger.info(f"Креатив {i}: Неверный формат (не файл): {creative_file}")
            else:
                logger.info("Креативы не загружены")
            if proofs:
                logger.info(f"Пруфы: {len(proofs)} файлов")
                for i, proof_file in enumerate(proofs, 1):
                    if hasattr(proof_file, 'name'):
                        logger.info(f"Пруф {i}: {proof_file.name}, размер: {proof_file.size} байт")
                    else:
                        logger.info(f"Пруф {i}: Неверный формат (не файл): {proof_file}")
            else:
                logger.info("Пруфы не загружены")
            if video:
                logger.info(f"Видео: {video.name}, размер: {video.size} байт")
                logger.info(f"ID видео: {video_ids[0] if video_ids else 'Не сохранён'}")
            else:
                logger.info("Видео не загружено")
            logger.info("=== Переменные окружения ===")
            for key, value in os.environ.items():
                logger.info(f"{key}: {value}")
            logger.info("=== Настройки Yandex Object Storage ===")
            logger.info(f"AWS_ACCESS_KEY_ID: {getattr(settings, 'AWS_ACCESS_KEY_ID', 'Не задано')}")
            logger.info(f"AWS_SECRET_ACCESS_KEY: {getattr(settings, 'AWS_SECRET_ACCESS_KEY', 'Не задано')}")
            logger.info(f"AWS_STORAGE_BUCKET_NAME: {getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'Не задано')}")
            logger.info(f"AWS_S3_ENDPOINT_URL: {getattr(settings, 'AWS_S3_ENDPOINT_URL', 'Не задано')}")
            logger.info(f"AWS_DEFAULT_ACL: {getattr(settings, 'AWS_DEFAULT_ACL', 'Не задано')}")
            logger.info("=== Проверка STORAGES ===")
            logger.info(f"STORAGES['default']['BACKEND']: {settings.STORAGES['default']['BACKEND']}")
            logger.info(f"default_storage: {default_storage.__class__.__name__}")
            logger.info("=== Проверка подключения к Yandex Object Storage ===")
            try:
                from storages.backends.s3boto3 import S3Boto3Storage
                from django.core.files.base import ContentFile
                storage = S3Boto3Storage()
                test_file_name = f"test/test_file_{startup.startup_id}.txt"
                test_content = "This is a test file to check Yandex Object Storage connection."
                test_file = ContentFile(test_content.encode('utf-8'))
                storage.save(test_file_name, test_file)
                logger.info(f"Тестовый файл успешно сохранён: {test_file_name}")
                test_file_url = storage.url(test_file_name)
                logger.info(f"URL тестового файла: {test_file_url}")
                storage.delete(test_file_name)
                logger.info(f"Тестовый файл удалён: {test_file_name}")
            except Exception as e:
                logger.error(f"Ошибка подключения к Yandex Object Storage: {str(e)}", exc_info=True)

            messages.success(request, f'Стартап "{startup.title}" успешно отредактирован и отправлен на модерацию!')
            return redirect('profile')
        else:
            messages.error(request, 'Форма содержит ошибки.')
            return render(request, 'accounts/edit_startup.html', {'form': form, 'startup': startup, 'timeline_steps': timeline_steps})
    else:
        form = StartupForm(instance=startup)
    return render(request, 'accounts/edit_startup.html', {'form': form, 'startup': startup, 'timeline_steps': timeline_steps})

# Панель модератора
def moderator_dashboard(request):
    if not request.user.is_authenticated or request.user.role.role_name != 'moderator':
        messages.error(request, 'У вас нет прав для этого действия.')
        return redirect('home')
    pending_startups = Startups.objects.filter(status='pending')
    return render(request, 'accounts/moderator_dashboard.html', {'pending_startups': pending_startups})

def approve_startup(request, startup_id):
    if not request.user.is_authenticated or request.user.role.role_name != 'moderator':
        messages.error(request, 'У вас нет прав для этого действия.')
        return redirect('home')
    startup = get_object_or_404(Startups, startup_id=startup_id)
    if request.method == 'POST':
        moderator_comment = request.POST.get('moderator_comment', '')
        startup.moderator_comment = moderator_comment
        startup.status = 'approved'
        try:
            startup.status_id = ReviewStatuses.objects.get(status_name='Approved')
        except ReviewStatuses.DoesNotExist:
            raise ValueError("Статус 'Approved' не найден в базе данных.")
        startup.save()
        messages.success(request, 'Стартап одобрен.')
    return redirect('moderator_dashboard')

def reject_startup(request, startup_id):
    if not request.user.is_authenticated or request.user.role.role_name != 'moderator':
        messages.error(request, 'У вас нет прав для этого действия.')
        return redirect('home')
    startup = get_object_or_404(Startups, startup_id=startup_id)
    if request.method == 'POST':
        moderator_comment = request.POST.get('moderator_comment', '')
        startup.moderator_comment = moderator_comment
        startup.status = 'rejected'
        try:
            startup.status_id = ReviewStatuses.objects.get(status_name='Rejected')
        except ReviewStatuses.DoesNotExist:
            raise ValueError("Статус 'Rejected' не найден в базе данных.")
        startup.save()
        messages.success(request, 'Стартап отклонен.')
    return redirect('moderator_dashboard')

# Голосование за стартап
@login_required
def vote_startup(request, startup_id):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Неверный метод запроса'})

    startup = get_object_or_404(Startups, startup_id=startup_id)
    rating = int(request.POST.get('rating', 0))

    if not 1 <= rating <= 5:
        return JsonResponse({'success': False, 'error': 'Недопустимое значение рейтинга'})

    if UserVotes.objects.filter(user=request.user, startup=startup).exists():
        return JsonResponse({'success': False, 'error': 'Вы уже голосовали за этот стартап'})

    UserVotes.objects.create(
        user=request.user,
        startup=startup,
        rating=rating,
        created_at=timezone.now()
    )
    startup.total_voters += 1
    startup.sum_votes += rating
    startup.save()

    average_rating = startup.sum_votes / startup.total_voters if startup.total_voters > 0 else 0
    return JsonResponse({'success': True, 'average_rating': average_rating})

@login_required
def invest(request, startup_id):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Неверный метод запроса'})

    startup = get_object_or_404(Startups, startup_id=startup_id)
    
    # Проверка роли пользователя и статуса стартапа
    if not request.user.is_authenticated or request.user.role.role_name != 'investor':
        return JsonResponse({'success': False, 'error': 'Только инвесторы могут инвестировать'})
    if startup.status in ['blocked', 'closed']:
        return JsonResponse({'success': False, 'error': f'Инвестирование запрещено: стартап {startup.status}'})

    try:
        amount = Decimal(request.POST.get('amount', '0'))
        if amount <= 0:
            return JsonResponse({'success': False, 'error': 'Сумма должна быть больше 0'})
        
        # Создание записи об инвестиции
        transaction = InvestmentTransactions(
            startup=startup,
            investor=request.user,
            amount=amount,
            is_micro=startup.micro_investment_available,
            transaction_type=TransactionTypes.objects.get(type_name='investment'),
            transaction_status='completed',
            payment_method=PaymentMethods.objects.get(method_name='default'),
            created_at=timezone.now(),
            updated_at=timezone.now()
        )
        transaction.save()

        # Обновление суммы собранных средств
        startup.amount_raised = (startup.amount_raised or Decimal('0')) + amount
        startup.total_invested = (startup.total_invested or Decimal('0')) + amount
        startup.save()

        # Подсчёт уникальных инвесторов и процента прогресса
        investors_count = startup.get_investors_count()
        progress_percentage = startup.get_progress_percentage()

        return JsonResponse({
            'success': True,
            'amount_raised': float(startup.amount_raised),
            'investors_count': investors_count,
            'progress_percentage': float(progress_percentage)
        })
    except Exception as e:
        logger.error(f"Ошибка при инвестировании: {str(e)}")
        return JsonResponse({'success': False, 'error': 'Произошла ошибка при инвестировании'})
    

# Форма для создания новости
class NewsForm(forms.Form):
    title = forms.CharField(max_length=255, label="Заголовок")
    content = forms.CharField(widget=forms.Textarea, label="Текст новости")
    image = forms.ImageField(label="Картинка", required=False)

def news(request):
    if request.method == 'POST':
        if not request.user.is_authenticated or request.user.role.role_name != 'moderator':
            return JsonResponse({'success': False, 'error': 'У вас нет прав для этого действия.'})

        form = NewsForm(request.POST, request.FILES)
        if form.is_valid():
            article = NewsArticles(
                title=form.cleaned_data['title'],
                content=form.cleaned_data['content'],
                author=request.user,
                published_at=timezone.now(),
                updated_at=timezone.now(),
                tags='Администрация'  # Автоматический тег
            )
            article.save()  # Сохраняем, чтобы получить article_id

            # Сохранение картинки в папке news/<article_id>/
            image = form.cleaned_data.get('image')
            if image:
                image_id = str(uuid.uuid4())
                file_path = f"news/{article.article_id}/{image_id}_{image.name}"
                default_storage.save(file_path, image)
                article.image_url = file_path
                article.save()

            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'Форма содержит ошибки.'})

    articles = NewsArticles.objects.all().order_by('-published_at')
    return render(request, 'accounts/news.html', {'articles': articles})

def news_detail(request, article_id):
    article = get_object_or_404(NewsArticles, article_id=article_id)

    # Увеличиваем счётчик просмотров
    user = request.user if request.user.is_authenticated else None
    if not NewsViews.objects.filter(article=article, user=user).exists():
        NewsViews.objects.create(
            article=article,
            user=user,
            viewed_at=timezone.now()
        )

    # Подсчёт просмотров и лайков
    views_count = NewsViews.objects.filter(article=article).count()
    likes_count = NewsLikes.objects.filter(article=article).count()
    user_liked = NewsLikes.objects.filter(article=article, user=user).exists() if user else False

    # Обработка лайка
    if request.method == 'POST' and request.user.is_authenticated and 'like' in request.POST:
        if not user_liked:
            NewsLikes.objects.create(
                article=article,
                user=request.user,
                created_at=timezone.now()
            )
            likes_count += 1
            user_liked = True

    return render(request, 'accounts/news_detail.html', {
        'article': article,
        'views_count': views_count,
        'likes_count': likes_count,
        'user_liked': user_liked,
    })

# Создание новости
@login_required
def create_news(request):
    if not request.user.is_authenticated or request.user.role.role_name != 'moderator':
        messages.error(request, 'У вас нет прав для этого действия.')
        return redirect('news')

    if request.method == 'POST':
        form = NewsForm(request.POST, request.FILES)
        if form.is_valid():
            article = NewsArticles(
                title=form.cleaned_data['title'],
                content=form.cleaned_data['content'],
                author=request.user,
                published_at=timezone.now(),
                updated_at=timezone.now(),
                tags='Администрация'  # Автоматический тег
            )

            # Сохранение картинки
            image = form.cleaned_data.get('image')
            if image:
                image_id = str(uuid.uuid4())
                file_path = f"news/{image_id}_{image.name}"
                default_storage.save(file_path, image)
                article.image_url = file_path

            article.save()
            messages.success(request, 'Новость успешно создана!')
            return redirect('news')
    else:
        form = NewsForm()

    return render(request, 'accounts/create_news.html', {'form': form})


def delete_news(request, article_id):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Неверный метод запроса'})

    if not request.user.is_authenticated or request.user.role.role_name != 'moderator':
        return JsonResponse({'success': False, 'error': 'У вас нет прав для этого действия.'})

    article = get_object_or_404(NewsArticles, article_id=article_id)
    
    # Удаляем картинку из хранилища, если она есть
    if article.image_url:
        try:
            default_storage.delete(article.image_url)
        except Exception as e:
            logger.error(f"Ошибка при удалении картинки новости {article_id}: {str(e)}")

    article.delete()
    return JsonResponse({'success': True})

# accounts/views.py
def cosmochat(request):
    # Проверяем авторизацию
    if not request.user.is_authenticated:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': 'Требуется авторизация'}, status=401)
        messages.error(request, 'Пожалуйста, войдите в систему, чтобы получить доступ к чату.')
        return redirect('login')

    # Получаем чаты пользователя
    chats = ChatConversations.objects.filter(
        chatparticipants__user=request.user
    ).order_by('-updated_at')

    # Форма для поиска пользователей
    search_form = UserSearchForm(request.GET)
    users = Users.objects.all()
    if search_form.is_valid():
        query = search_form.cleaned_data.get('query', '')
        roles = search_form.cleaned_data.get('roles', [])
        if query:
            users = users.filter(
                models.Q(email__icontains=query) | 
                models.Q(first_name__icontains=query) |
                models.Q(last_name__icontains=query)
            )
        if roles:
            users = users.filter(role__role_name__in=roles)

    # Исключаем текущего пользователя из списка
    users = users.exclude(user_id=request.user.user_id)

    # Если есть параметр chat_id, исключаем текущих участников чата
    chat_id = request.GET.get('chat_id')
    if chat_id:
        chat = ChatConversations.objects.filter(conversation_id=chat_id).first()
        if chat:
            participant_ids = chat.chatparticipants_set.values_list('user_id', flat=True)
            users = users.exclude(user_id__in=participant_ids)
        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': 'Чат не найден'}, status=404)

    # Создаём форму для отправки сообщений
    message_form = MessageForm()

    # Если это AJAX-запрос, возвращаем JSON
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        users_data = [{
            'user_id': user.user_id,
            'name': f"{user.first_name} {user.last_name}",
            'role': user.role.role_name if user.role else 'Система'
        } for user in users]
        return JsonResponse({'users': users_data})

    return render(request, 'accounts/cosmochat.html', {
        'search_form': search_form,
        'users': users,
        'chats': chats,
        'message_form': message_form,
    })

# accounts/views.py
def get_chat_messages(request, chat_id):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Требуется авторизация'})

    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse({'success': False, 'error': 'У вас нет доступа к этому чату'})

    # Получаем параметр since из запроса
    since = request.GET.get('since')
    messages = chat.messages_set.all()
    if since:
        try:
            from datetime import datetime
            since_dt = datetime.fromisoformat(since.replace('Z', '+00:00'))
            messages = messages.filter(created_at__gt=since_dt)
        except ValueError:
            return JsonResponse({'success': False, 'error': 'Неверный формат параметра since'})

    messages = messages.order_by('created_at')
    messages_data = [{
        'message_id': msg.message_id,
        'sender_id': msg.sender.user_id if msg.sender else None,
        'sender_name': f"{msg.sender.first_name} {msg.sender.last_name}" if msg.sender else "Неизвестно",
        'message_text': msg.message_text,
        'created_at': msg.created_at.strftime('%d.%m.%Y %H:%M') if msg.created_at else '',
        'created_at_iso': msg.created_at.isoformat() if msg.created_at else '',
        'is_read': msg.is_read(),
        'is_own': msg.sender == request.user if msg.sender else False
    } for msg in messages]

    participants = chat.get_participants()
    participants_data = [{
        'user_id': p.user.user_id,
        'name': f"{p.user.first_name} {p.user.last_name}",
        'role': p.user.role.role_name if p.user.role else 'Неизвестно'
    } for p in participants]

    return JsonResponse({
        'success': True,
        'messages': messages_data,
        'participants': participants_data
    })

# accounts/views.py
@login_required
def send_message(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Неверный метод запроса'})

    form = MessageForm(request.POST)
    if not form.is_valid():
        return JsonResponse({'success': False, 'error': 'Неверные данные формы'})

    chat_id = request.POST.get('chat_id')
    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse({'success': False, 'error': 'У вас нет доступа к этому чату'})

    message = Messages(
        conversation=chat,
        sender=request.user,
        message_text=form.cleaned_data['message_text'],
        status=MessageStatuses.objects.get(status_name='sent'),
        created_at=timezone.now(),
        updated_at=timezone.now()
    )
    message.save()

    chat.updated_at = timezone.now()
    chat.save()

    return JsonResponse({
        'success': True,
        'message': {
            'message_id': message.message_id,  # Добавляем message_id
            'sender_id': request.user.user_id,
            'sender_name': f"{request.user.first_name} {request.user.last_name}",
            'message_text': message.message_text,
            'created_at': message.created_at.strftime('%d.%m.%Y %H:%M'),
            'created_at_iso': message.created_at.isoformat(),
            'is_read': message.is_read(),
            'is_own': True
        }
    })

@login_required
def mark_messages_read(request, chat_id):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Неверный метод запроса'})

    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse({'success': False, 'error': 'У вас нет доступа к этому чату'})

    # Обновляем статус непрочитанных сообщений (кроме своих)
    read_status = MessageStatuses.objects.get(status_name='read')
    messages = chat.messages_set.filter(
        status__status_name='sent'
    ).exclude(sender=request.user)
    messages.update(status=read_status, updated_at=timezone.now())

    return JsonResponse({'success': True})

@login_required
def start_chat(request, user_id):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Неверный метод запроса'})

    target_user = get_object_or_404(Users, user_id=user_id)
    if target_user == request.user:
        return JsonResponse({'success': False, 'error': 'Нельзя создать чат с самим собой'})

    # Проверяем, существует ли чат между пользователями
    existing_chats = ChatConversations.objects.filter(
        chatparticipants__user=request.user
    ).filter(chatparticipants__user=target_user)
    if existing_chats.exists():
        chat = existing_chats.first()
        return JsonResponse({'success': True, 'chat_id': chat.conversation_id})

    # Определяем роли
    user_role = request.user.role.role_name.lower() if request.user.role else None
    target_role = target_user.role.role_name.lower() if target_user.role else None
    if not user_role or not target_role:
        return JsonResponse({'success': False, 'error': 'Роли пользователей не определены'})

    # Создаём чат только с двумя участниками
    chat = ChatConversations(
        name=f"Чат {request.user.first_name} + {target_user.first_name}",
        created_at=timezone.now(),
        updated_at=timezone.now()
    )
    chat.save()

    # Добавляем участников
    ChatParticipants.objects.create(conversation=chat, user=request.user)
    ChatParticipants.objects.create(conversation=chat, user=target_user)

    return JsonResponse({'success': True, 'chat_id': chat.conversation_id})





@login_required
def add_participant(request, chat_id):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Неверный метод запроса'})

    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse({'success': False, 'error': 'У вас нет доступа к этому чату'})

    # Проверяем, сколько участников уже в чате
    participants = chat.get_participants()
    if participants.count() >= 3:
        return JsonResponse({'success': False, 'error': 'В чате уже максимальное количество участников (3)'})

    # Определяем текущие роли в чате
    current_roles = {p.user.role.role_name.lower() for p in participants if p.user and p.user.role}
    required_roles = {'startuper', 'investor', 'moderator'}
    missing_role = (required_roles - current_roles).pop() if (required_roles - current_roles) else None
    if not missing_role:
        return JsonResponse({'success': False, 'error': 'Все роли уже заняты'})

    # Находим пользователя с недостающей ролью (сортируем по количеству чатов)
    new_user = Users.objects.filter(
        role__role_name__iexact=missing_role
    ).exclude(
        user_id__in=[p.user.user_id for p in participants]
    ).annotate(
        chat_count=Count('chatparticipants')
    ).order_by('chat_count').first()
    if not new_user:
        return JsonResponse({'success': False, 'error': f'Не найден пользователь с ролью {missing_role}'})

    # Добавляем нового участника
    ChatParticipants.objects.create(conversation=chat, user=new_user)
    chat.name = f"{chat.name} + {new_user.first_name}"
    chat.updated_at = timezone.now()
    chat.save()

    return JsonResponse({
        'success': True,
        'new_participant': {
            'user_id': new_user.user_id,
            'name': f"{new_user.first_name} {new_user.last_name}",
            'role': new_user.role.role_name if new_user.role else 'Неизвестно'
        }
    })

@login_required
def leave_chat(request, chat_id):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Неверный метод запроса'})

    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse({'success': False, 'error': 'У вас нет доступа к этому чату'})

    # Удаляем текущего пользователя из участников
    ChatParticipants.objects.filter(conversation=chat, user=request.user).delete()

    # Отправляем уведомление оставшимся участникам
    remaining_participants = chat.chatparticipants_set.all()
    if remaining_participants.exists():
        message = Messages(
            conversation=chat,
            sender=None,  # Системное сообщение
            message_text=f"{request.user.first_name} {request.user.last_name} покинул чат",
            status=MessageStatuses.objects.get(status_name='sent'),
            created_at=timezone.now(),
            updated_at=timezone.now()
        )
        message.save()
        chat.updated_at = timezone.now()
        chat.save()
    else:
        # Если участников не осталось, удаляем чат полностью
        chat.delete()
        return JsonResponse({'success': True, 'deleted': True})

    return JsonResponse({'success': True, 'deleted': False})


# accounts/views.py
import boto3

def planetary_system(request):
    # Получаем все направления из базы данных
    directions = Directions.objects.all()

    # Получаем текущую категорию (галактику) из GET-параметра или берём случайную
    selected_galaxy = request.GET.get('galaxy', '')
    if selected_galaxy:
        current_direction = Directions.objects.filter(direction_name=selected_galaxy).first()
    else:
        current_direction = Directions.objects.order_by('?').first()  # Случайная категория, если не выбрана
    selected_galaxy = current_direction.direction_name if current_direction else 'Технологии'

    # Получаем стартапы для текущей категории
    planetary_startups = Startups.objects.filter(
        status='approved',
        direction=current_direction
    ).order_by('?')

    # Логируем общее количество стартапов в категории
    logger.info(f"Найдено стартапов в категории '{selected_galaxy}': {planetary_startups.count()}")

    # Ограничиваем до 8 стартапов (или берём столько, сколько есть, если меньше)
    planetary_startups = planetary_startups[:8]
    logger.info(f"Выбрано стартапов для отображения: {len(planetary_startups)}")

    # Инициализируем S3-клиент для доступа к Yandex Object Storage
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        region_name=settings.AWS_S3_REGION_NAME
    )

    # Формируем данные для планет
    planets_data = []
    for idx, startup in enumerate(planetary_startups, 1):
        # Проверяем наличие logo_urls
        if not startup.logo_urls or not isinstance(startup.logo_urls, list) or len(startup.logo_urls) == 0:
            logger.warning(f"Стартап {startup.startup_id} ({startup.title}) не имеет логотипа в logo_urls")
            logo_url = 'https://via.placeholder.com/150'
        else:
            try:
                # Формируем префикс для поиска файла в папке startups/{startup_id}/logos/
                prefix = f"startups/{startup.startup_id}/logos/"

                # Ищем файлы в этой папке
                response = s3_client.list_objects_v2(
                    Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                    Prefix=prefix
                )

                # Проверяем, есть ли файлы в папке
                if 'Contents' in response and len(response['Contents']) > 0:
                    # Берём первый (и единственный) файл
                    file_key = response['Contents'][0]['Key']
                    # Генерируем URL без подписи, так как файл публичный
                    logo_url = f"https://storage.yandexcloud.net/{settings.AWS_STORAGE_BUCKET_NAME}/{file_key}"
                    logger.info(f"Сгенерирован URL для логотипа стартапа {startup.startup_id}: {logo_url}")
                else:
                    logger.warning(f"Файл для логотипа стартапа {startup.startup_id} не найден в бакете по префиксу {prefix}")
                    logo_url = 'https://via.placeholder.com/150'
            except Exception as e:
                logger.error(f"Ошибка при генерации URL для логотипа стартапа {startup.startup_id}: {str(e)}")
                logo_url = 'https://via.placeholder.com/150'

        # Вычисляем размеры орбит и планет
        orbit_size = 200 + (idx - 1) * 100
        orbit_time = 80 + (idx - 1) * 20
        planet_size = idx * 2 + 50

        planet_data = {
            'id': idx,
            'startup_id': startup.startup_id,  # Добавляем startup_id
            'name': startup.title,
            'description': startup.description,
            'rating': f"{startup.get_average_rating():.1f}/5 ({startup.total_voters})",
            'progress': f"{startup.get_progress_percentage():.0f}%",
            'funding': f"{startup.amount_raised or 0} ₽",
            'investors': f"Инвесторов: {startup.get_investors_count()}",
            'image': logo_url,
            'orbit_size': orbit_size,
            'orbit_time': orbit_time,
            'planet_size': planet_size,
        }
        planets_data.append(planet_data)

    # Данные для логотипа планетарной системы
    logo_data = {
        'image': 'https://storage.yandexcloud.net/1-st-test-bucket-for-startup-platform-3gb-1/planets/Group%20645.png'
    }

    context = {
        'planets_data': planets_data,
        'directions': directions,
        'selected_galaxy': selected_galaxy,
        'logo_data': logo_data,
    }
    return render(request, 'accounts/planetary_system.html', context)


# accounts/views.py
@login_required
def my_startups(request):
    # Проверяем роль пользователя
    if not hasattr(request.user, 'role') or request.user.role.role_name != 'startuper':
        messages.error(request, 'Доступ к этой странице разрешен только стартаперам.')
        return redirect('profile') # Или на другую страницу, например, home

    # Получаем ВСЕ стартапы пользователя (не только одобренные)
    user_startups_qs = Startups.objects.filter(owner=request.user).select_related(
        'direction', 'stage', 'status_id'
    ).prefetch_related('comments') # Предзагружаем комментарии

    # --- Расчет общего количества стартапов пользователя ---
    total_user_startups_count = user_startups_qs.count()

    # Фильтруем одобренные стартапы для основной секции и финансовой аналитики
    approved_startups_qs = user_startups_qs.filter(status='approved')

    # --- Расчет ФИНАНСОЧВОЙ аналитики по ОДОБРЕННЫМ стартапам ---
    financial_analytics_data = approved_startups_qs.aggregate(
        total_raised=Sum('amount_raised'),
        max_raised=Max('amount_raised'),
        min_raised=Min('amount_raised'),
        approved_startups_count=Count('startup_id') # Считаем только одобренные для этой статистики
    )

    approved_startups_count = financial_analytics_data.get('approved_startups_count', 0) # Количество одобренных
    total_amount_raised = financial_analytics_data.get('total_raised') or Decimal('0')
    max_raised = financial_analytics_data.get('max_raised') or Decimal('0')
    min_raised = financial_analytics_data.get('min_raised') or Decimal('0')

    # --- Данные по категориям для радиальных диаграмм (на основе КОЛИЧЕСТВА ВСЕХ стартапов) ---
    category_data_raw = user_startups_qs.values( # Используем ВСЕ стартапы пользователя
        'direction__direction_name'
    ).annotate(
        category_count=Count('startup_id') # Считаем КОЛИЧЕСТВО стартапов
    ).order_by('-category_count')

    investment_categories = []
    invested_category_data_dict = {} # Используем старое имя для совместимости с JS
    # Используем общее количество стартапов пользователя для расчета процентов
    total_for_category_percentage = total_user_startups_count if total_user_startups_count > 0 else 1

    for cat_data in category_data_raw:
        percentage = 0
        category_count = cat_data.get('category_count') # Получаем количество
        category_name = cat_data.get('direction__direction_name') or 'Без категории'

        if category_count and total_for_category_percentage > 0:
            try:
                # Расчет процента от ОБЩЕГО количества стартапов
                percentage = round((int(category_count) / total_for_category_percentage) * 100)
                percentage = min(percentage, 100)
            except Exception as e:
                logger.error(f"Ошибка расчета процента (по количеству) для категории '{category_name}': {e}")
                percentage = 0

        investment_categories.append({
            'name': category_name, # Исходное имя для JS
            'percentage': percentage,
        })
        invested_category_data_dict[category_name] = percentage

    # --- Данные для графика по месяцам (по сумме amount_raised ОДОБРЕННЫМ стартапов) ---
    # Оставляем логику без изменений, так как она показывает финансовый прогресс
    current_year = timezone.now().year
    monthly_data_direct = approved_startups_qs.filter(
        updated_at__year=current_year,
        amount_raised__gt=0
    ).annotate(
        month=TruncMonth('updated_at')
    ).values('month').annotate(
        # Используем Coalesce для замены NULL на 0 перед суммированием
        monthly_total=Sum(Coalesce('amount_raised', Decimal(0)))
    ).order_by('month')

    month_labels = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
    monthly_totals = [0] * 12
    for data in monthly_data_direct:
        month_index = data['month'].month - 1
        if 0 <= month_index < 12:
            monthly_total_decimal = data.get('monthly_total', Decimal(0)) or Decimal(0)
            monthly_totals[month_index] = float(monthly_total_decimal)

    # --- Получаем одобренные стартапы с аннотациями для основной сетки ---
    approved_startups_annotated = approved_startups_qs.annotate(
         average_rating=Avg(
            models.ExpressionWrapper(
                Coalesce(models.F('sum_votes'), 0) * 1.0 / Coalesce(models.F('total_voters'), 1), # Используем Coalesce для избежания деления на ноль
                output_field=FloatField()
            ),
            filter=models.Q(total_voters__gt=0), # Фильтр все еще полезен для определения, были ли голоса
            default=0.0 # Значение по умолчанию
        ),
        comment_count=Count('comments') # Используем prefetch_related
    ).annotate(
         average_rating=Coalesce('average_rating', 0.0) # Дополнительный Coalesce на всякий случай
    ).order_by('-created_at') # Сортировка по умолчанию - новые

    # --- Получаем все стартапы пользователя для секции "Заявки" ---
    all_user_applications = user_startups_qs.order_by('-updated_at') # Сортируем по дате обновления

    # --- Все направления для модального окна ---
    all_directions_qs = Directions.objects.all().order_by('direction_name')
    # Преобразуем в список словарей для JSON, передавая оригинальное имя для JS
    # Исправляем использование .values() - передаем имена полей как строки
    all_directions_list = list(all_directions_qs.values('pk', 'direction_name'))

    # --- Данные для СТЕКОВОГО графика по категориям --- 
    current_year = timezone.now().year
    logger.info(f"[my_startups] Preparing chart data for user {request.user.email}, year: {current_year}") # Лог: начало подготовки данных
    month_labels = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
    
    # Получаем данные: месяц обновления, категория, сумма сборов за этот месяц и категорию
    monthly_category_data_raw = approved_startups_qs.filter(
        updated_at__year=current_year,
        amount_raised__gt=0,
        direction__isnull=False # Исключаем стартапы без категории
    ).annotate(
        month=TruncMonth('updated_at')
    ).values(
        'month', 'direction__direction_name' # Группируем по месяцу и названию категории
    ).annotate(
        monthly_category_total=Sum(Coalesce('amount_raised', Decimal(0)))
    ).order_by('month', 'direction__direction_name')

    # Лог: результат сырого запроса к БД
    logger.info(f"[my_startups] Raw monthly category data from DB: {list(monthly_category_data_raw)}")

    # Структурируем данные для Chart.js (месяц -> категория -> сумма)
    structured_monthly_data = collections.defaultdict(lambda: collections.defaultdict(float))
    unique_categories = set()

    for data in monthly_category_data_raw:
        month_dt = data['month']
        category_name = data['direction__direction_name']
        amount = float(data.get('monthly_category_total', 0) or 0)
        month_key = month_dt.strftime('%Y-%m-01') 
        structured_monthly_data[month_key][category_name] += amount
        unique_categories.add(category_name)
        
    sorted_categories = sorted(list(unique_categories))
    # Лог: найденные категории
    logger.info(f"[my_startups] Unique categories found for chart: {sorted_categories}")

    # Подготавливаем данные для передачи в JSON
    chart_data_list = []
    start_date = datetime.date(current_year, 1, 1)
    # Импортируем relativedelta, если еще не импортирован
    from dateutil.relativedelta import relativedelta 
    for i in range(12):
        current_month_key = (start_date + relativedelta(months=i)).strftime('%Y-%m-01')
        month_data = {
            'month_key': current_month_key,
            'category_data': dict(structured_monthly_data[current_month_key])
        }
        chart_data_list.append(month_data)
        
    # Лог: финальные данные для графика
    logger.info(f"[my_startups] Final structured chart data list: {chart_data_list}")

    # --- Данные для планетарной системы ---
    planetary_startups = []
    for idx, startup in enumerate(approved_startups_annotated, start=1):
        # Получаем URL логотипа через метод get_logo_url()
        logo_url = startup.get_logo_url() or 'https://via.placeholder.com/150'

        # Вычисляем значения для orbit-size, orbit-time и planet-size
        orbit_size = (idx * 100) + 100  # forloop.counter|mul:100|add:100
        orbit_time = (idx * 20) + 60    # forloop.counter|mul:20|add:60
        planet_size = (idx * 2) + 50    # forloop.counter|mul:2|add:50

        planet_data = {
            'id': str(idx),
            'startup_id': startup.startup_id,
            'name': startup.title or 'Без названия',
            'description': startup.description or 'Описание отсутствует',
            'rating': f"{startup.get_average_rating():.1f}/5 ({startup.total_voters or 0})",
            'progress': f"{startup.get_progress_percentage():.0f}%",
            'funding': f"{int(startup.amount_raised or 0):,d} ₽".replace(',', ' '),
            'investors': f"Инвесторов: {startup.get_investors_count() or 0}",
            'image': logo_url,
            'orbit_size': orbit_size,    # Передаём вычисленное значение
            'orbit_time': orbit_time,    # Передаём вычисленное значение
            'planet_size': planet_size,  # Передаём вычисленное значение
        }
        planetary_startups.append(planet_data)

    context = {
        'startups_count': approved_startups_count,
        'total_investment': total_amount_raised,
        'max_investment': max_raised,
        'min_investment': min_raised,
        'investment_categories': investment_categories[:7],
        'month_labels': month_labels,
        'chart_monthly_category_data': chart_data_list,
        'chart_categories': sorted_categories,
        'all_directions': all_directions_list,
        'invested_category_data': invested_category_data_dict,
        'user_startups': approved_startups_annotated,
        'startup_applications': all_user_applications,
        'current_sort': 'newest',
        'planetary_startups': planetary_startups,
    }

    return render(request, 'accounts/my_startups.html', context)