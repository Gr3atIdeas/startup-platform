import collections
import datetime
import json
import logging
import os
import uuid
from decimal import Decimal
from random import choice, shuffle
import boto3
import requests
from boto3 import client
from dateutil.relativedelta import relativedelta
from django import forms
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.staticfiles import finders
from django.core.files.storage import default_storage
from django.core.paginator import Paginator
from django.core.serializers.json import DjangoJSONEncoder
from django.db import (
    models,
    transaction,
)
from django.db.models import (
    Avg,
    Case,
    Count,
    DecimalField,
    Exists,
    ExpressionWrapper,
    F,
    FloatField,
    Max,
    Min,
    OuterRef,
    Q,
    Subquery,
    Sum,
    Value,
    When,
)
from django.db.models.functions import (
    Coalesce,
    TruncMonth,
)
from django.http import HttpResponse, HttpResponseForbidden, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.template.loader import render_to_string
from django.templatetags.static import static
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.utils.text import slugify
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .forms import (
    CommentForm,
    LoginForm,
    MessageForm,
    ModeratorTicketForm,
    ProfileEditForm,
    RegisterForm,
    StartupForm,
    SupportTicketForm,
    UserSearchForm,
)
from .models import (
    ChatConversations,
    ChatParticipants,
    Comments,
    Directions,
    EntityTypes,
    FileStorage,
    FileTypes,
    InvestmentTransactions,
    Messages,
    MessageStatuses,
    NewsArticles,
    NewsLikes,
    NewsViews,
    PaymentMethods,
    ReviewStatuses,
    Startups,
    StartupTimeline,
    SupportTicket,
    TransactionTypes,
    Users,
    UserVotes,
)
from .utils import send_telegram_support_message
logger = logging.getLogger(__name__)
def safe_create_file_storage(entity_type, entity_id, file_type, file_url, uploaded_at, startup, original_file_name):
    """
    Безопасно создает объект FileStorage, учитывая наличие/отсутствие поля original_file_name
    """
    if hasattr(FileStorage, 'original_file_name'):
        try:
            return FileStorage.objects.create(
                entity_type=entity_type,
                entity_id=entity_id,
                file_type=file_type,
                file_url=file_url,
                uploaded_at=uploaded_at,
                startup=startup,
                original_file_name=original_file_name,
            )
        except Exception:
            return FileStorage.objects.create(
                entity_type=entity_type,
                entity_id=entity_id,
                file_type=file_type,
                file_url=file_url,
                uploaded_at=uploaded_at,
                startup=startup,
            )
    else:
        return FileStorage.objects.create(
            entity_type=entity_type,
            entity_id=entity_id,
            file_type=file_type,
            file_url=file_url,
            uploaded_at=uploaded_at,
            startup=startup,
        )
def safe_create_file_storage_instance(entity_type, entity_id, file_type, file_url, uploaded_at, startup, original_file_name):
    """
    Безопасно создает и сохраняет экземпляр FileStorage, учитывая наличие/отсутствие поля original_file_name
    """
    if hasattr(FileStorage, 'original_file_name'):
        try:
            file_storage = FileStorage(
                entity_type=entity_type,
                entity_id=entity_id,
                file_type=file_type,
                file_url=file_url,
                uploaded_at=uploaded_at,
                startup=startup,
                original_file_name=original_file_name,
            )
            file_storage.save()
            return file_storage
        except Exception:
            file_storage = FileStorage(
                entity_type=entity_type,
                entity_id=entity_id,
                file_type=file_type,
                file_url=file_url,
                uploaded_at=uploaded_at,
                startup=startup,
            )
            file_storage.save()
            return file_storage
    else:
        file_storage = FileStorage(
            entity_type=entity_type,
            entity_id=entity_id,
            file_type=file_type,
            file_url=file_url,
            uploaded_at=uploaded_at,
            startup=startup,
        )
        file_storage.save()
        return file_storage
def get_unique_filename(original_name, startup_id, file_type_name):
    """
    Генерирует уникальное имя файла, добавляя (2), (3) и т.д. если файл с таким именем уже существует
    """
    name, ext = os.path.splitext(original_name)
    try:
        file_type = FileTypes.objects.get(type_name=file_type_name)
        if not hasattr(FileStorage, 'original_file_name'):
            return original_name
        try:
            existing_files = FileStorage.objects.filter(
                startup_id=startup_id,
                file_type=file_type,
                original_file_name=original_name
            )
            if not existing_files.exists():
                return original_name
            counter = 2
            while True:
                new_name = f"{name} ({counter}){ext}"
                existing_duplicate = FileStorage.objects.filter(
                    startup_id=startup_id,
                    file_type=file_type,
                    original_file_name=new_name
                )
                if not existing_duplicate.exists():
                    return new_name
                counter += 1
        except Exception:
            return original_name
    except FileTypes.DoesNotExist:
        logger.error(f"FileType '{file_type_name}' не найден")
        return original_name
DIRECTION_TRANSLATIONS = {
    'Beauty': 'Красота', 'Technology': 'Технологии', 'Healthcare': 'Здравоохранение', 'Health': 'Здоровье',
    'Finance': 'Финансы', 'Cafe': 'Кафе/рестораны', 'Restaurant': 'Кафе/рестораны', 'Delivery': 'Доставка',
    'Fastfood': 'Фастфуд', 'Sport': 'Спорт', 'Transport': 'Транспорт', 'Psychology': 'Психология',
    'AI': 'ИИ', 'Auto': 'Авто',
    'Education': 'Образование', 'Entertainment': 'Развлечения',
    'Fashion': 'Мода', 'Food': 'Еда', 'Gaming': 'Игры', 'Real Estate': 'Недвижимость', 'Travel': 'Путешествия',
    'Agriculture': 'Сельское хозяйство', 'Energy': 'Энергетика', 'Environment': 'Экология', 'Social': 'Социальные проекты', 'Media': 'Медиа',
    'E-commerce': 'Электронная коммерция', 'Biotech': 'Биотехнологии', 'Construction': 'Строительство',
    'Logistics': 'Логистика', 'Manufacturing': 'Производство', 'Retail': 'Розничная торговля', 'Security': 'Безопасность', 'Insurance': 'Страхование',
    'Legal': 'Юридические услуги', 'Consulting': 'Консалтинг', 'Marketing': 'Маркетинг', 'IT': 'ИТ', 'Software': 'Программное обеспечение',
    'Hardware': 'Аппаратное обеспечение', 'Mobile': 'Мобильные приложения', 'Web': 'Веб-разработка', 'Blockchain': 'Блокчейн',
    'Cryptocurrency': 'Криптовалюты', 'VR': 'Виртуальная реальность', 'AR': 'Дополненная реальность', 'IoT': 'Интернет вещей',
    'Robotics': 'Робототехника', 'Space': 'Космические технологии', 'Science': 'Наука', 'Research': 'Исследования',     'Other': 'Другое',
}
FIXED_CATEGORIES = [
    {'original_name': 'Technology', 'direction_name': 'Технологии'},
    {'original_name': 'Healthcare', 'direction_name': 'Здравоохранение'},
    {'original_name': 'Finance', 'direction_name': 'Финансы'},
    {'original_name': 'Education', 'direction_name': 'Образование'},
    {'original_name': 'Entertainment', 'direction_name': 'Развлечения'},
    {'original_name': 'Fashion', 'direction_name': 'Мода'},
    {'original_name': 'Food', 'direction_name': 'Еда'},
    {'original_name': 'Gaming', 'direction_name': 'Игры'},
    {'original_name': 'Real Estate', 'direction_name': 'Недвижимость'},
    {'original_name': 'Travel', 'direction_name': 'Путешествия'},
    {'original_name': 'Agriculture', 'direction_name': 'Сельское хозяйство'},
    {'original_name': 'Energy', 'direction_name': 'Энергетика'},
    {'original_name': 'Environment', 'direction_name': 'Экология'},
    {'original_name': 'Social', 'direction_name': 'Социальные проекты'},
]
def home(request):
    if not request.user.is_authenticated:
        import random
        from django.db.models import Avg, Count, Sum, F, Case, When, Value, FloatField, DecimalField
        from django.db.models.functions import Coalesce
        from django.templatetags.static import static
        startups_query = Startups.objects.filter(status="approved").annotate(
            rating_avg=Coalesce(Avg("uservotes__rating"), 0.0, output_field=FloatField()),
            voters_count=Count("uservotes", distinct=True),
            total_investors=Count("investmenttransactions", distinct=True),
            current_funding=Coalesce(
                Sum("investmenttransactions__amount"), 0, output_field=DecimalField()
            ),
            comment_count=Count("comments", distinct=True),
            progress=Case(
                When(funding_goal__gt=0, then=(F("amount_raised") * 100.0 / F("funding_goal"))),
                default=Value(0),
                output_field=FloatField(),
            )
        )
        all_startups = list(startups_query)
        demo_startups = []
        if all_startups:
            num_startups = min(6, len(all_startups))
            demo_startups = random.sample(all_startups, num_startups)
        startups_data = []
        for startup in demo_startups:
            planet_num = random.randint(1, 15)
            planet_image_url = static(f"accounts/images/planetary_system/planets_round/{planet_num}.png")
            startups_data.append({
                "id": startup.startup_id,
                "name": startup.title,
                "description": startup.short_description or startup.description[:200] if startup.description else "",
                "image": planet_image_url,
                "rating": round(startup.rating_avg, 2),
                "voters_count": startup.voters_count,
                "comment_count": startup.comment_count,
                "direction": startup.direction.direction_name if startup.direction else "Не указано",
                "funding_goal": f"{startup.funding_goal:,.0f} ₽".replace(",", " ") if startup.funding_goal else "Не указано",
                "valuation": f"{startup.valuation:,.0f} ₽".replace(",", " ") if startup.valuation else "Не указано",
                "investors": startup.total_investors,
                "progress": round(startup.progress, 2) if startup.progress is not None else 0,
                "investment_type": "Выкуп+инвестирование" if startup.both_mode else ("Только выкуп" if startup.only_buy else "Только инвестирование")
            })
        # Убираем заполнение пустыми орбитами - показываем только реальные стартапы
        context = {
            "demo_startups_data": json.dumps(startups_data, cls=DjangoJSONEncoder),
        }
        return render(request, "accounts/main.html", context)
    if hasattr(request.user, "role") and request.user.role:
        role_name = request.user.role.role_name.lower()
        if role_name == "investor":
            return redirect("investor_main")
        elif role_name == "startuper":
            return redirect("startupper_main")
        elif role_name == "moderator":
            return redirect("main_page_moderator")
    return redirect("profile")
def faq_page_view(request):
    return render(request, "accounts/faq.html")
def contacts_page_view(request):
    return render(request, "accounts/contacts.html", {})
def register(request):
    next_url = request.GET.get("next") or request.POST.get("next")
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data["password"])
            user.save()
            messages.success(
                request, "Регистрация прошла успешно! Теперь вы можете войти."
            )
            if next_url:
                login_url = reverse("login") + f"?next={next_url}"
                return redirect(login_url)
            return redirect("login")
        else:
            return render(request, "accounts/register.html", {"form": form, "next": next_url})
    else:
        form = RegisterForm()
    return render(request, "accounts/register.html", {"form": form, "next": next_url})
def user_login(request):
    logger.debug("Entering user_login view")
    next_url = request.GET.get("next") or request.POST.get("next")
    if request.method == "POST":
        logger.debug("Processing POST request in user_login")
        form = LoginForm(request.POST)
        if form.is_valid():
            logger.debug(f"Form is valid. Email: {form.cleaned_data['email']}")
            user = authenticate(
                request,
                email=form.cleaned_data["email"],
                password=form.cleaned_data["password"],
            )
            if user is not None:
                logger.info(f"User authenticated: {user.email}")
                login(request, user)
                messages.success(
                    request, f"Добро пожаловать, {user.first_name or user.email}!"
                )
                if next_url == reverse("create_startup"):
                    if hasattr(user, "role") and user.role and user.role.role_name.lower() == "startuper":
                        return redirect(next_url)
                    else:
                        role_name = user.role.role_name.lower() if hasattr(user, "role") and user.role else None
                        if role_name == "investor":
                            return redirect("investor_main")
                        elif role_name == "moderator":
                            return redirect("main_page_moderator")
                        else:
                            return redirect("home")
                if hasattr(user, "role") and user.role:
                    role_name = user.role.role_name.lower()
                    if role_name == "investor":
                        return redirect("investor_main")
                    elif role_name == "startuper":
                        return redirect("startupper_main")
                    elif role_name == "moderator":
                        return redirect("main_page_moderator")
                return redirect("home")
            else:
                logger.warning("Authentication failed for email")
                messages.error(request, "Неверный email или пароль.")
        else:
            logger.warning(f"Form invalid: {form.errors}")
        return render(request, "accounts/login.html", {"form": form, "next": next_url})
    else:
        logger.debug("Rendering login form")
        form = LoginForm()
    return render(request, "accounts/login.html", {"form": form, "next": next_url})
def user_logout(request):
    logout(request)
    messages.success(request, "Вы успешно вышли из системы.")
    return redirect("home")
def startups_list(request):
    directions = Directions.objects.all()
    startups_qs = Startups.objects.filter(status="approved")
    selected_categories = request.GET.getlist("category")
    micro_investment = request.GET.get("micro_investment") == "1"
    search_query = request.GET.get("search", "").strip()
    min_rating_str = request.GET.get("min_rating", "0")
    max_rating_str = request.GET.get("max_rating", "5")
    sort_order = request.GET.get("sort_order", "newest")
    page_number = request.GET.get("page", 1)
    startups_qs = startups_qs.annotate(
        total_voters_agg=Count("uservotes", distinct=True),
        total_investors_agg=Count("investmenttransactions", distinct=True),
        current_funding_sum_agg=Coalesce(
            Sum("investmenttransactions__amount"), 0, output_field=DecimalField()
        ),
        rating_agg=ExpressionWrapper(
            Coalesce(Avg("uservotes__rating"), 0.0), output_field=FloatField()
        ),
    ).annotate(
        progress_agg=ExpressionWrapper(
            Coalesce(
                Case(
                    When(
                        funding_goal__gt=0,
                        then=F("current_funding_sum_agg") * 100.0 / F("funding_goal"),
                    ),
                    default=Value(0),
                    output_field=FloatField(),
                ),
                0.0,
            ),
            output_field=FloatField(),
        )
    )
    categories = list(
        Directions.objects.annotate(id=F("direction_id"), name=F("direction_name"))
        .values("id", "name")
        .order_by("name")
    )
    if selected_categories:
        startups_qs = startups_qs.filter(
            direction__direction_name__in=selected_categories
        )
    if micro_investment:
        startups_qs = startups_qs.filter(micro_investment_available=True)
    if search_query:
        startups_qs = startups_qs.filter(title__icontains=search_query)
    try:
        min_rating = float(min_rating_str)
        max_rating = float(max_rating_str)
        if min_rating > 0:
            startups_qs = startups_qs.filter(rating_agg__gte=min_rating)
        if max_rating < 5:
            startups_qs = startups_qs.filter(rating_agg__lte=max_rating)
    except ValueError:
        min_rating = 0
        max_rating = 5
    if sort_order == "newest":
        startups_qs = startups_qs.order_by("-created_at")
    elif sort_order == "oldest":
        startups_qs = startups_qs.order_by("created_at")
    paginator = Paginator(startups_qs, 6)
    page_obj = paginator.get_page(page_number)
    is_ajax = request.headers.get("x-requested-with") == "XMLHttpRequest"
    if is_ajax:
        html = render_to_string(
            "accounts/partials/_startup_cards.html", {"page_obj": page_obj}
        )
        return JsonResponse(
            {
                "html": html,
                "has_next": page_obj.has_next(),
                "page_number": page_obj.number,
                "num_pages": paginator.num_pages,
                "count": paginator.count,
                "total_voters_agg": "total_voters_agg",
                "rating_agg": "rating_agg",
                "progress_agg": "progress_agg",
                "current_funding_sum_agg": "current_funding_sum_agg",
                "total_investors_agg": "total_investors_agg",
            }
        )
    else:
        context = {
            "page_obj": page_obj,
            "paginator": paginator,
            "initial_has_next": page_obj.has_next(),
            "selected_categories": selected_categories,
            "micro_investment": micro_investment,
            "search_query": search_query,
            "min_rating": min_rating,
            "max_rating": max_rating,
            "sort_order": sort_order,
            "directions": directions,
        }
        return render(request, "accounts/startups_list.html", context)
def search_suggestions(request):
    query = request.GET.get("q", "").strip()
    users = []
    if len(query) >= 2:
        search_results = Users.objects.filter(
            Q(first_name__icontains=query)
            | Q(last_name__icontains=query)
            | Q(email__icontains=query)
        ).distinct()[:10]
        users = [
            {
                "id": user.user_id,
                "name": f"{user.first_name or ''} {user.last_name or ''} ({user.email})".strip(),
            }
            for user in search_results
        ]
    return JsonResponse({"suggestions": users})
def startup_detail(request, startup_id):
    try:
        startup = Startups.objects.select_related("owner", "direction", "stage").get(
            startup_id=startup_id
        )
    except Startups.DoesNotExist:
        return get_object_or_404(Startups, startup_id=startup_id)
    if request.method == "POST":
        if not request.user.is_authenticated:
            return redirect("login")
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.startup_id = startup
            comment.user_id = request.user
            user_vote = UserVotes.objects.filter(
                user=request.user, startup=startup
            ).first()
            if user_vote:
                comment.user_rating = user_vote.rating
            comment.save()
            messages.success(request, "Ваш комментарий был добавлен.")
            return redirect("startup_detail", startup_id=startup.startup_id)
        else:
            messages.error(request, "Ошибка при добавлении комментария.")
    else:
        form = CommentForm()
    comments_with_rating = (
        Comments.objects.filter(startup_id=startup, parent_comment_id__isnull=True)
        .annotate(
            user_rating=models.Subquery(
                UserVotes.objects.filter(
                    startup=startup, user=models.OuterRef("user_id_id")
                ).values("rating")[:1]
            )
        )
        .order_by("-created_at")
    )
    average_rating = (
        startup.sum_votes / startup.total_voters if startup.total_voters > 0 else 0
    )
    comments = Comments.objects.filter(
        startup_id=startup, parent_comment_id__isnull=True
    ).order_by("-created_at")
    form = CommentForm()
    average_rating = startup.get_average_rating()
    total_votes = startup.total_voters
    user_has_voted = False
    if request.user.is_authenticated:
        user_has_voted = UserVotes.objects.filter(
            user=request.user, startup=startup
        ).exists()
    rating_distribution_query = (
        UserVotes.objects.filter(startup=startup)
        .values("rating")
        .annotate(count=Count("rating"))
        .order_by("-rating")
    )
    rating_distribution = {
        item["rating"]: item["count"] for item in rating_distribution_query
    }
    for i in range(1, 6):
        rating_distribution.setdefault(i, 0)
    similar_startups = (
        Startups.objects.filter(status="approved")
        .exclude(startup_id=startup.startup_id)
        .order_by("?")[:4]
    )
    similar_startups = similar_startups.annotate(
        average_rating_calc=Avg(
            models.ExpressionWrapper(
                models.F("sum_votes") * 1.0 / models.F("total_voters"),
                output_field=FloatField(),
            ),
            filter=models.Q(total_voters__gt=0),
        )
    ).annotate(average_rating=Coalesce("average_rating_calc", 0.0))
    logo_urls = startup.logo_urls if isinstance(startup.logo_urls, list) else []
    creatives_urls = (
        startup.creatives_urls if isinstance(startup.creatives_urls, list) else []
    )
    video_urls = startup.video_urls if isinstance(startup.video_urls, list) else []
    show_moderator_comment = False
    if startup.moderator_comment and (
        request.user == startup.owner
        or (
            request.user.is_authenticated
            and hasattr(request.user, "role")
            and request.user.role.role_name == "moderator"
        )
    ):
        show_moderator_comment = True
    progress_percentage = 0
    if startup.funding_goal and startup.funding_goal > 0:
        progress_percentage = (
            (startup.amount_raised / startup.funding_goal) * 100
            if startup.amount_raised
            else 0
        )
        progress_percentage = min(progress_percentage, 100)
    investors_count = startup.get_investors_count()
    timeline_events = StartupTimeline.objects.filter(startup=startup).order_by(
        "step_number"
    )
    try:
        proof_file_type = FileTypes.objects.get(type_name="proof")
        startup_documents = FileStorage.objects.filter(
            startup=startup, file_type=proof_file_type
        ).order_by("-uploaded_at")
    except FileTypes.DoesNotExist:
        startup_documents = FileStorage.objects.none()
    context = {
        "startup": startup,
        "comments": comments_with_rating,
        "form": form,
        "average_rating": average_rating,
        "total_votes_count": total_votes,
        "user_has_voted": user_has_voted,
        "rating_distribution": rating_distribution,
        "similar_startups": similar_startups,
        "logo_urls": logo_urls,
        "creatives_urls": creatives_urls,
        "video_urls": video_urls,
        "show_moderator_comment": show_moderator_comment,
        "progress_percentage": progress_percentage,
        "investors_count": investors_count,
        "timeline_events": timeline_events,
        "startup_documents": startup_documents,
    }
    return render(request, "accounts/startup_detail.html", context)
def load_similar_startups(request, startup_id: int):
    current_startup_id = startup_id
    similar_startups = (
        Startups.objects.filter(status="approved")
        .exclude(startup_id=current_startup_id)
        .order_by("?")[:4]
    )
    similar_startups = similar_startups.annotate(
        average_rating_calc=Avg(
            models.ExpressionWrapper(
                models.F("sum_votes") * 1.0 / models.F("total_voters"),
                output_field=FloatField(),
            ),
            filter=models.Q(total_voters__gt=0),
        )
    ).annotate(average_rating=Coalesce("average_rating_calc", 0.0))
    html = render_to_string(
        "accounts/_similar_startup_cards.html",
        {"similar_startups": similar_startups, "request": request},
    )
    return HttpResponse(html)
@login_required
def investments(request):
    if not hasattr(request.user, "role") or request.user.role.role_name != "investor":
        messages.error(request, "Доступ к этой странице разрешен только инвесторам.")
        return redirect("profile")
    try:
        user_investments_qs = InvestmentTransactions.objects.filter(
            investor=request.user, transaction_type__type_name="investment"
        ).select_related("startup", "startup__direction", "startup__owner")
        total_investment_data = user_investments_qs.aggregate(
            total_investment=Sum("amount"),
            max_investment=Max("amount"),
            startups_count=Count("startup", distinct=True),
        )
        total_investment = total_investment_data.get("total_investment") or Decimal("0")
        max_investment = total_investment_data.get("max_investment") or Decimal("0")
        
        # Вычисляем минимальное значение только среди инвестиций с ненулевыми суммами
        investments_with_amount = user_investments_qs.filter(amount__gt=0)
        min_investment_data = investments_with_amount.aggregate(
            min_investment=Min("amount")
        )
        min_investment = min_investment_data.get("min_investment") or Decimal("0")
        startups_count = total_investment_data.get("startups_count", 0)
        logger.info(
            f"[investments] User: {request.user.email}, Total Investment: {total_investment}"
        )
        category_data_raw = (
            user_investments_qs.values("startup__direction__direction_name")
            .annotate(category_total=Sum("amount"))
            .order_by("-category_total")
        )
        investment_categories = []
        invested_category_data_dict = {}
        total_for_category_percentage = (
            total_investment if total_investment > 0 else Decimal("1")
        )
        for cat_data in category_data_raw:
            percentage = 0
            category_sum = cat_data.get("category_total")
            category_name = (
                cat_data.get("startup__direction__direction_name") or "Без категории"
            )
            if category_sum and total_for_category_percentage > 0:
                try:
                    percentage = round(
                        (Decimal(category_sum) / total_for_category_percentage) * 100
                    )
                    percentage = min(percentage, 100)
                except Exception as e:
                    logger.error(
                        f"Ошибка расчета процента для категории '{category_name}': {e}"
                    )
                    percentage = 0
            investment_categories.append(
                {"name": category_name, "percentage": percentage}
            )
            invested_category_data_dict[category_name] = percentage
        current_year = timezone.now().year
        logger.info(
            f"[investments] Preparing chart data for user {request.user.email}, year: {current_year}"
        )
        monthly_data_direct = (
            user_investments_qs.filter(created_at__year=current_year, amount__gt=0)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(monthly_total=Sum(Coalesce("amount", Decimal(0))))
            .order_by("month")
        )
        month_labels = [
            "Янв",
            "Фев",
            "Мар",
            "Апр",
            "Май",
            "Июн",
            "Июл",
            "Авг",
            "Сен",
            "Окт",
            "Ноя",
            "Дек",
        ]
        monthly_totals = [0] * 12
        for data in monthly_data_direct:
            month_index = data["month"].month - 1
            if 0 <= month_index < 12:
                monthly_total_decimal = data.get(
                    "monthly_total", Decimal(0)
                ) or Decimal(0)
                monthly_totals[month_index] = float(monthly_total_decimal)
        logger.info(
            f"[investments] Preparing chart data for user {request.user.email}, year: {current_year}"
        )
        monthly_category_data_raw = (
            user_investments_qs.filter(
                created_at__year=current_year,
                amount__gt=0,
                startup__direction__isnull=False,
            )
            .annotate(month=TruncMonth("created_at"))
            .values("month", "startup__direction__direction_name")
            .annotate(monthly_category_total=Sum(Coalesce("amount", Decimal(0))))
            .order_by("month", "startup__direction__direction_name")
        )
        logger.info(
            f"[investments] Raw monthly category data from DB: {list(monthly_category_data_raw)}"
        )
        structured_monthly_data = collections.defaultdict(
            lambda: collections.defaultdict(float)
        )
        unique_categories = set()
        for data in monthly_category_data_raw:
            month_dt = data["month"]
            category_name = data["startup__direction__direction_name"]
            amount = float(data.get("monthly_category_total", 0) or 0)
            month_key = month_dt.strftime("%Y-%m-01")
            structured_monthly_data[month_key][category_name] += amount
            unique_categories.add(category_name)
        sorted_categories = sorted(list(unique_categories))
        logger.info(
            f"[investments] Unique categories found for chart: {sorted_categories}"
        )
        chart_data_list = []
        start_date = datetime.date(current_year, 1, 1)
        for i in range(12):
            current_month_key = (start_date + relativedelta(months=i)).strftime(
                "%Y-%m-01"
            )
            month_data = {
                "month_key": current_month_key,
                "category_data": dict(structured_monthly_data[current_month_key]),
            }
            chart_data_list.append(month_data)
        logger.info(
            f"[investments] Final structured chart data list: {chart_data_list}"
        )
        s3_client = client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            region_name=settings.AWS_S3_REGION_NAME,
        )
        invested_startups_qs = (
            user_investments_qs.select_related("startup")
            .annotate(
                average_rating=Avg(
                    ExpressionWrapper(
                        Coalesce(F("startup__sum_votes"), 0)
                        * 1.0
                        / Coalesce(F("startup__total_voters"), 1),
                        output_field=FloatField(),
                    ),
                    filter=Q(startup__total_voters__gt=0),
                    default=0.0,
                ),
                comment_count=Count("startup__comments", distinct=True),
                investors_count=Count(
                    "startup__investmenttransactions__investor", distinct=True
                ),
            )
            .order_by("-amount")[:5]
        )
        owned_startups_qs = (
            Startups.objects.filter(owner_id=request.user.user_id, status="approved")
            .select_related("direction")
            .annotate(
                average_rating=Avg(
                    ExpressionWrapper(
                        Coalesce(F("sum_votes"), 0)
                        * 1.0
                        / Coalesce(F("total_voters"), 1),
                        output_field=FloatField(),
                    ),
                    filter=Q(total_voters__gt=0),
                    default=0.0,
                ),
                comment_count=Count("comments", distinct=True),
                investors_count=Count(
                    "investmenttransactions__investor", distinct=True
                ),
            )
            .order_by("-amount_raised")[:5]
        )
        planetary_investments = []
        min_orbit_size = 200
        max_orbit_size = 800
        orbit_step = 50
        available_sizes = list(
            range(min_orbit_size, max_orbit_size + orbit_step, orbit_step)
        )
        shuffle(available_sizes)
        for idx, startup in enumerate(
            list(invested_startups_qs) + list(owned_startups_qs), 1
        ):
            if hasattr(startup, "startup"):
                startup_obj = startup.startup
            else:
                startup_obj = startup
            if (
                not startup_obj.logo_urls
                or not isinstance(startup_obj.logo_urls, list)
                or len(startup_obj.logo_urls) == 0
            ):
                logger.warning(
                    f"Стартап {startup_obj.startup_id} ({startup_obj.title}) не имеет логотипа в logo_urls"
                )
                logo_url = "https://via.placeholder.com/150"
            else:
                try:
                    prefix = f"startups/{startup_obj.startup_id}/logos/"
                    response = s3_client.list_objects_v2(
                        Bucket=settings.AWS_STORAGE_BUCKET_NAME, Prefix=prefix
                    )
                    if "Contents" in response and len(response["Contents"]) > 0:
                        file_key = response["Contents"][0]["Key"]
                        logo_url = f"https://storage.yandexcloud.net/{settings.AWS_STORAGE_BUCKET_NAME}/{file_key}"
                        logger.info(
                            f"Сгенерирован URL для логотипа стартапа {startup_obj.startup_id}: {logo_url}"
                        )
                    else:
                        logger.warning(
                            f"Файл для логотипа стартапа {startup_obj.startup_id} не найден в бакете по префиксу {prefix}"
                        )
                        logo_url = "https://via.placeholder.com/150"
                except Exception as e:
                    logger.error(
                        f"Ошибка при генерации URL для логотипа стартапа {startup_obj.startup_id}: {str(e)}"
                    )
                    logo_url = "https://via.placeholder.com/150"
            orbit_size = (idx * 100) + 100
            orbit_time = (idx * 20) + 60
            planet_size = (idx * 2) + 50
            investment_type = (
                "Инвестирование"
                if startup_obj.only_invest
                else "Выкуп"
                if startup_obj.only_buy
                else "Выкуп+инвестирование"
                if startup_obj.both_mode
                else "Не указано"
            )
            planet_data = {
                "id": str(idx),
                "startup_id": startup_obj.startup_id,
                "name": startup_obj.title or "Без названия",
                "description": startup_obj.description or "Описание отсутствует",
                "rating": f"{(startup.average_rating or 0):.1f}/5 ({startup_obj.total_voters or 0})",
                "comment_count": startup.comment_count or 0,
                "progress": f"{(startup_obj.amount_raised / startup_obj.funding_goal * 100 if startup_obj.funding_goal else 0):.0f}%",
                "direction": startup_obj.direction.direction_name
                if startup_obj.direction
                else "Не указано",
                "investment_type": investment_type,
                "funding": f"{int(startup_obj.amount_raised or 0):,d} ₽".replace(
                    ",", " "
                ),
                "funding_goal": f"{int(startup_obj.funding_goal or 0):,d} ₽".replace(
                    ",", " "
                ),
                "investors": f"Инвесторов: {startup.investors_count or 0}",
                "image": logo_url,
                "orbit_size": orbit_size,
                "orbit_time": orbit_time,
                "planet_size": planet_size,
            }
            planetary_investments.append(planet_data)
        logger.info(
            f"[investments] Planetary investments for user {request.user.email}: {planetary_investments}"
        )
        user_investments = (
            user_investments_qs.select_related("startup")
            .annotate(
                startup_average_rating=Avg(
                    ExpressionWrapper(
                        F("startup__sum_votes") * 1.0 / F("startup__total_voters"),
                        output_field=FloatField(),
                    ),
                    filter=Q(startup__total_voters__gt=0),
                    default=0.0,
                ),
                startup_comment_count=Count("startup__comments", distinct=True),
            )
            .order_by("-created_at")
        )
        user_owned_startups = (
            Startups.objects.filter(owner_id=request.user.user_id)
            .select_related("direction", "stage", "status_id")
            .annotate(
                average_rating=Avg(
                    ExpressionWrapper(
                        Coalesce(F("sum_votes"), 0)
                        * 1.0
                        / Coalesce(F("total_voters"), 1),
                        output_field=FloatField(),
                    ),
                    filter=Q(total_voters__gt=0),
                    default=0.0,
                ),
                comment_count=Count("comments"),
            )
            .order_by("-created_at")
        )
        all_directions_qs = Directions.objects.all().order_by("direction_name")
        all_directions_list = list(all_directions_qs.values("pk", "direction_name"))
        context = {
            "startups_count": startups_count,
            "total_investment": total_investment,
            "max_investment": max_investment,
            "min_investment": min_investment,
            "investment_categories": investment_categories[:7],
            "month_labels": month_labels,
            "chart_monthly_category_data": chart_data_list,
            "chart_categories": sorted_categories,
            "all_directions": all_directions_list,
            "invested_category_data": invested_category_data_dict,
            "user_investments": user_investments,
            "user_owned_startups": user_owned_startups,
            "current_sort": "newest",
            "planetary_investments": planetary_investments,
            "investor_logo_url": request.user.get_profile_picture_url()
            or "https://via.placeholder.com/60",
        }
        return render(request, "accounts/investments.html", context)
    except Exception as e:
        logger.error(f"Произошла ошибка в investments: {str(e)}", exc_info=True)
        messages.error(
            request,
            "Произошла ошибка при загрузке страницы. Пожалуйста, попробуйте снова.",
        )
        return redirect("profile")
def legal(request):
    return render(request, "accounts/legal.html")
@login_required
def profile(request, user_id=None):
    if not user_id:
        user_id_param = request.GET.get("user_id")
        if user_id_param:
            try:
                user_id = int(user_id_param)
            except ValueError:
                user_id = None
    if user_id:
        user = get_object_or_404(Users, user_id=user_id)
        is_own_profile = request.user.user_id == user.user_id
    else:
        user = request.user
        is_own_profile = True
    if request.headers.get("x-requested-with") == "XMLHttpRequest" and request.method == "GET":
        user_data = {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.role_name if user.role else "",
            "profile_picture_url": user.get_profile_picture_url() if hasattr(user, "get_profile_picture_url") else "",
            "rating": getattr(user, "rating", None),
            "bio": getattr(user, "bio", ""),
        }
        return JsonResponse(user_data)
    show_role_selection = (not user.role_id or user.role_id == 4) and is_own_profile
    if request.method == "POST" and is_own_profile:
        if "select_role" in request.POST:
            role_id = request.POST.get("role_id")
            if role_id in ["1", "2"]:
                user.role_id = int(role_id)
                user.save(update_fields=["role"])
                messages.success(request, "Роль успешно выбрана!")
                return redirect("profile")
            else:
                messages.error(request, "Выбрана неверная роль.")
                return redirect("profile")
        elif "edit_profile" in request.POST:
            form = ProfileEditForm(request.POST, instance=user)
            if form.is_valid():
                form.save()
                if request.headers.get("x-requested-with") == "XMLHttpRequest":
                    return JsonResponse(
                        {"success": True, "message": "Профиль успешно обновлен!"}
                    )
                messages.success(request, "Профиль успешно обновлен!")
                return redirect("profile")
            else:
                if request.headers.get("x-requested-with") == "XMLHttpRequest":
                    return JsonResponse({"success": False, "errors": form.errors})
                messages.error(request, "Пожалуйста, исправьте ошибки.")
        elif "avatar" in request.FILES:
            user.profile_picture_url = request.FILES["avatar"]
            user.save(update_fields=["profile_picture_url"])
            messages.success(request, "Аватар успешно обновлен!")
            return redirect("profile")
    form = ProfileEditForm(instance=user)
    startups_list = Startups.objects.filter(owner=user).order_by("-created_at")
    startups_paginator = Paginator(startups_list, 5)
    startups_page_number = request.GET.get("startups_page")
    startups_page_obj = startups_paginator.get_page(startups_page_number)
    news_list = NewsArticles.objects.filter(author=user).order_by("-published_at")
    news_paginator = Paginator(news_list, 6)
    news_page_number = request.GET.get("news_page")
    news_page_obj = news_paginator.get_page(news_page_number)
    context = {
        "user": user,
        "is_own_profile": is_own_profile,
        "show_role_selection": show_role_selection,
        "form": form,
        "startups_page": startups_page_obj,
        "news_page": news_page_obj,
    }
    return render(request, "accounts/profile.html", context)
@login_required
def delete_avatar(request):
    if request.method == "POST":
        user = request.user
        if "avatar" in request.FILES:
            avatar = request.FILES["avatar"]
            allowed_mimes = ["image/jpeg", "image/png"]
            if avatar.content_type not in allowed_mimes:
                messages.error(request, "Допустимы только файлы PNG или JPEG.")
                if request.headers.get("X-Requested-With") == "XMLHttpRequest":
                    return JsonResponse(
                        {
                            "success": False,
                            "error": "Допустимы только файлы PNG или JPEG.",
                        }
                    )
                return render(
                    request,
                    "accounts/profile.html",
                    {
                        "user": user,
                        "is_own_profile": True,
                        "form": form,
                        "startups_page": startups_page,
                        "news_page": news_page,
                        "show_role_selection": show_role_selection,
                    },
                )
            max_size = 5 * 1024 * 1024
            if avatar.size > max_size:
                messages.error(request, "Размер файла не должен превышать 5 МБ.")
                if request.headers.get("X-Requested-With") == "XMLHttpRequest":
                    return JsonResponse(
                        {
                            "success": False,
                            "error": "Размер файла не должен превышать 5 МБ.",
                        }
                    )
                return render(
                    request,
                    "accounts/profile.html",
                    {
                        "user": user,
                        "is_own_profile": True,
                        "form": form,
                        "startups_page": startups_page,
                        "news_page": news_page,
                        "show_role_selection": show_role_selection,
                    },
                )
            avatar_id = str(uuid.uuid4())
            file_path = f"users/{request.user.user_id}/avatar/{avatar_id}_{avatar.name}"
            try:
                s3_client = boto3.client(
                    "s3",
                    endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_S3_REGION_NAME,
                )
                bucket_name = settings.AWS_STORAGE_BUCKET_NAME
                prefix = f"users/{request.user.user_id}/avatar/"
                response = s3_client.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
                if "Contents" in response:
                    for obj in response["Contents"]:
                        s3_client.delete_object(Bucket=bucket_name, Key=obj["Key"])
                        logger.info(f"Удалён старый аватар: {obj['Key']}")
                FileStorage.objects.filter(
                    entity_type__type_name="user",
                    entity_id=request.user.user_id,
                    file_type__type_name="avatar",
                ).delete()
                default_storage.save(file_path, avatar)
                request.user.profile_picture_url = avatar_id
                request.user.save()
                entity_type, _ = EntityTypes.objects.get_or_create(type_name="user")
                file_type, _ = FileTypes.objects.get_or_create(type_name="avatar")
                FileStorage.objects.create(
                    entity_type=entity_type,
                    entity_id=request.user.user_id,
                    file_url=avatar_id,
                    file_type=file_type,
                    uploaded_at=timezone.now(),
                )
                logger.info(
                    f"Аватар сохранён для user_id {request.user.user_id} по пути: {file_path}, UUID: {avatar_id}"
                )
                messages.success(request, "Аватарка успешно загружена!")
                if request.headers.get("X-Requested-With") == "XMLHttpRequest":
                    return JsonResponse(
                        {"success": True, "message": "Аватарка успешно загружена!"}
                    )
            except Exception as e:
                logger.error(
                    f"Ошибка при сохранении аватара для user_id {request.user.user_id}: {str(e)}"
                )
                messages.error(request, "Ошибка при загрузке аватара.")
                if request.headers.get("X-Requested-With") == "XMLHttpRequest":
                    return JsonResponse(
                        {"success": False, "error": "Ошибка при загрузке аватара."}
                    )
            return redirect("profile")
    return render(
        request,
        "accounts/profile.html",
        {
            "user": user,
            "is_own_profile": profile_user == request.user,
            "form": form,
            "startups_page": startups_page,
            "news_page": news_page,
            "show_role_selection": show_role_selection,
        },
    )
@login_required
def chat_list(request):
    user = request.user
    chats = ChatConversations.objects.all().order_by('-updated_at')
    chat_data = []
    for chat in chats:
        participants = chat.chatparticipants_set.all()
        has_user = participants.filter(user=user).exists()
        is_deleted = getattr(chat, "is_deleted", False)
        has_left = not has_user and any(p.user != user for p in participants)
        if not has_user and (
            not user.role or user.role.role_name.lower() != "moderator"
        ):
            continue
        if (
            user.role
            and user.role.role_name.lower() == "moderator"
            and (chat.is_group_chat or chat.is_deal)
        ):
            other_participant = participants.exclude(user=user).first()
            participant_info = None
            if other_participant and not chat.is_group_chat and other_participant.user:
                participant_info = other_participant.user
            chat_data.append(
                {
                    "conversation_id": chat.conversation_id,
                    "name": chat.name if chat.name else f"Чат {chat.conversation_id}",
                    "is_group_chat": chat.is_group_chat,
                    "is_deal": chat.is_deal,
                    "is_deleted": is_deleted,
                    "has_left": has_left,
                    "participant": {
                        "user_id": participant_info.user_id
                        if participant_info
                        else None,
                        "first_name": participant_info.first_name
                        if participant_info
                        else None,
                        "last_name": participant_info.last_name
                        if participant_info
                        else None,
                        "profile_picture_url": participant_info.get_profile_picture_url()
                        if participant_info
                        else None,
                    }
                    if participant_info
                    else None,
                }
            )
        elif not is_deleted and not has_left and has_user:
            other_participant = participants.exclude(user=user).first()
            participant_info = None
            if other_participant and not chat.is_group_chat and other_participant.user:
                participant_info = other_participant.user
            chat_data.append(
                {
                    "conversation_id": chat.conversation_id,
                    "name": chat.name if chat.name else f"Чат {chat.conversation_id}",
                    "is_group_chat": chat.is_group_chat,
                    "is_deal": chat.is_deal,
                    "is_deleted": is_deleted,
                    "has_left": has_left,
                    "participant": {
                        "user_id": participant_info.user_id
                        if participant_info
                        else None,
                        "first_name": participant_info.first_name
                        if participant_info
                        else None,
                        "last_name": participant_info.last_name
                        if participant_info
                        else None,
                        "profile_picture_url": participant_info.get_profile_picture_url()
                        if participant_info
                        else None,
                    }
                    if participant_info
                    else None,
                }
            )
    logger.info(f"Chat list generated for user {user.email}: {len(chat_data)} chats")
    return JsonResponse({"success": True, "chats": chat_data})
@login_required
def start_deal(request, chat_id):
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Неверный метод запроса"}, status=405
        )
    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse(
            {"success": False, "error": "У вас нет доступа к этому чату"}, status=403
        )
    logger.info(
        f"Starting deal check for chat {chat_id}, participants: {chat.chatparticipants_set.count()}"
    )
    if chat.is_group_chat or chat.is_deal:
        logger.error(f"Chat {chat_id} is group or already a deal")
        return JsonResponse(
            {
                "success": False,
                "error": "Сделку можно начать только в личном чате, который ещё не является сделкой",
            },
            status=400,
        )
    participants = chat.chatparticipants_set.all()
    if (
        participants.count() < 2
    ):
        logger.error(
            f"Chat {chat_id} has {participants.count()} participants, expected at least 2"
        )
        return JsonResponse(
            {"success": False, "error": "В чате должно быть как минимум два участника"},
            status=400,
        )
    roles = {
        p.user.role.role_name.lower() for p in participants if p.user and p.user.role
    }
    if not {"startuper", "investor"}.issubset(roles):
        logger.error(
            f"Chat {chat_id} roles: {roles}, expected 'startuper' and 'investor'"
        )
        return JsonResponse(
            {
                "success": False,
                "error": "Чат должен включать одного стартапера и одного инвестора",
            },
            status=400,
        )
    try:
        data = json.loads(request.body)
        initiator_name = data.get(
            "initiator_name", request.user.get_full_name() or "Пользователь"
        )
    except json.JSONDecodeError:
        initiator_name = request.user.get_full_name() or "Пользователь"
    with transaction.atomic():
        chat.is_deal = True
        chat.deal_status = "pending"
        chat.updated_at = timezone.now()
        chat.save()
        moderators = Users.objects.filter(role__role_name="moderator")
        if not moderators.exists():
            return JsonResponse(
                {"success": False, "error": "Нет доступных модераторов"}, status=500
            )
        moderator = choice(list(moderators))
        moderator_participant, created = ChatParticipants.objects.get_or_create(
            conversation=chat, user=moderator
        )
        if not created and not moderator_participant:
            logger.error(
                f"Failed to create or find moderator {moderator.user_id} for chat {chat_id}"
            )
            return JsonResponse(
                {"success": False, "error": "Ошибка назначения модератора"}, status=500
            )
        logger.info(
            f"Moderator {moderator.user_id} added to chat {chat_id}, created: {created}"
        )
        message = Messages(
            conversation=chat,
            sender=None,
            message_text=f"Сделку начал {initiator_name}. Назначен модератор: {moderator.get_full_name()}",
            status=MessageStatuses.objects.get(status_name="sent"),
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )
        message.save()
    participants_data = [
        {
            "user_id": p.user.user_id,
            "name": p.user.get_full_name(),
            "role": p.user.role.role_name if p.user.role else "unknown",
        }
        for p in chat.chatparticipants_set.all()
    ]
    logger.info(
        f"Сделка начата в чате {chat_id}, модератор {moderator.user_id} назначен"
    )
    return JsonResponse(
        {
            "success": True,
            "message": "Сделка начата, модератор назначен",
            "moderator": {
                "user_id": moderator.user_id,
                "name": moderator.get_full_name(),
            },
            "participants": participants_data,
        }
    )
@login_required
def deals_view(request):
    if not hasattr(request.user, "role") or request.user.role.role_name != "moderator":
        messages.error(request, "Доступ к этой странице разрешен только модераторам.")
        logger.warning(
            f"Access denied for user {request.user.user_id} - not a moderator"
        )
        return redirect("home")
    status_filter = request.GET.get("status", "pending")
    valid_statuses = ["pending", "approved", "rejected"]
    if status_filter not in valid_statuses:
        status_filter = "pending"
    logger.info(
        f"Processing deals_view for user_id={request.user.user_id}, status_filter={status_filter}"
    )
    try:
        deals_query = (
            ChatConversations.objects.filter(is_deal=True, deal_status=status_filter)
            .prefetch_related("chatparticipants_set__user")
            .order_by("-updated_at")
        )
        logger.info(f"Initial query returned {deals_query.count()} deals")
    except Exception as e:
        logger.error(f"Error in initial query: {str(e)}")
        return JsonResponse({"error": f"Database query failed: {str(e)}"}, status=500)
    deals = deals_query.filter(chatparticipants__user=request.user)
    logger.info(f"Filtered deals for moderator {request.user.user_id}: {deals.count()}")
    for deal in deals:
        try:
            participants = deal.chatparticipants_set.all()
            logger.debug(
                f"Deal {deal.conversation_id}: Participants {[(p.user.user_id, p.user.role.role_name if p.user.role else 'None') for p in participants]}, Status: {deal.deal_status}"
            )
        except Exception as e:
            logger.error(f"Error processing deal {deal.conversation_id}: {str(e)}")
    deal_data = []
    selected_chat = None
    chat_id = request.GET.get("chat_id")
    if chat_id:
        try:
            selected_chat = get_object_or_404(
                ChatConversations, conversation_id=chat_id, is_deal=True
            )
            if not selected_chat.chatparticipants_set.filter(
                user=request.user
            ).exists():
                messages.error(request, "У вас нет доступа к этому чату.")
                logger.warning(
                    f"No access to chat {chat_id} for user {request.user.user_id}"
                )
                selected_chat = None
            else:
                messages = Messages.objects.filter(conversation=selected_chat).order_by(
                    "created_at"
                )
                messages_data = [
                    {
                        "message_id": msg.message_id,
                        "sender_name": msg.sender.get_full_name()
                        if msg.sender
                        else "Система",
                        "message_text": msg.message_text,
                        "created_at": msg.created_at.strftime("%H:%M %d/%m/%Y")
                        if msg.created_at
                        else "",
                        "is_own": msg.sender == request.user if msg.sender else False,
                    }
                    for msg in messages
                ]
                selected_chat_messages = messages_data
                logger.info(f"Loaded {len(messages_data)} messages for chat {chat_id}")
        except Exception as e:
            logger.error(f"Error loading chat {chat_id}: {str(e)}")
            messages.error(request, "Ошибка загрузки чата.")
            selected_chat = None
    for deal in deals:
        try:
            participants = deal.chatparticipants_set.all()
            moderator = next(
                (
                    p.user
                    for p in participants
                    if p.user.role and p.user.role.role_name == "moderator"
                ),
                None,
            )
            other_participants = [
                p.user for p in participants if p.user and p.user != moderator
            ]
            deal_data.append(
                {
                    "conversation_id": deal.conversation_id,
                    "name": deal.name or f"Сделка {deal.conversation_id}",
                    "participants": [
                        f"{p.first_name} {p.last_name}" for p in other_participants
                    ],
                    "moderator": moderator.get_full_name()
                    if moderator
                    else "Не назначен",
                    "last_message": deal.get_last_message().message_text
                    if deal.get_last_message()
                    else "Нет сообщений",
                    "created_at": deal.created_at.strftime("%H:%M")
                    if deal.created_at
                    else "",
                    "date": deal.created_at.strftime("%d/%m/%Y")
                    if deal.created_at
                    else "",
                    "unread_count": Messages.objects.filter(
                        conversation=deal, status__status_name="sent"
                    )
                    .exclude(sender=moderator)
                    .count()
                    if moderator
                    else 0,
                    "deal_status": deal.deal_status,
                }
            )
        except Exception as e:
            logger.error(
                f"Error processing deal data for {deal.conversation_id}: {str(e)}"
            )
    context = {
        "deals": deal_data,
        "current_status": status_filter,
        "selected_chat": selected_chat,
        "chat_messages": selected_chat_messages if selected_chat else [],
    }
    logger.info(f"Rendering deals.html with {len(deal_data)} deals")
    return render(request, "accounts/deals.html", context)
@login_required
def send_message(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Неверный метод запроса"})
    form = MessageForm(request.POST)
    if not form.is_valid():
        return JsonResponse({"success": False, "error": "Неверные данные формы"})
    chat_id = request.POST.get("chat_id")
    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse(
            {"success": False, "error": "У вас нет доступа к этому чату"}
        )
    if not request.user.role or request.user.role.role_name != "moderator":
        return JsonResponse(
            {
                "success": False,
                "error": "Только модератор может отправлять сообщения здесь",
            }
        )
    message = Messages(
        conversation=chat,
        sender=request.user,
        message_text=form.cleaned_data["message_text"],
        status=MessageStatuses.objects.get(status_name="sent"),
        created_at=timezone.now(),
        updated_at=timezone.now(),
    )
    message.save()
    chat.updated_at = timezone.now()
    chat.save()
    return JsonResponse(
        {
            "success": True,
            "message": {
                "message_id": message.message_id,
                "sender_name": request.user.get_full_name(),
                "message_text": message.message_text,
                "created_at": message.created_at.strftime("%H:%M %d/%m/%Y"),
                "is_own": True,
            },
        }
    )
@login_required
def approve_deal(request, chat_id):
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Неверный метод запроса"}, status=405
        )
    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists() or (
        request.user.role and request.user.role.role_name != "moderator"
    ):
        return JsonResponse(
            {"success": False, "error": "У вас нет прав для этого действия"}, status=403
        )
    if not chat.is_deal:
        return JsonResponse({"success": False, "error": "Это не сделка"}, status=400)
    with transaction.atomic():
        chat.deal_status = "approved"
        chat.updated_at = timezone.now()
        chat.save()
        message = Messages(
            conversation=chat,
            sender=None,
            message_text=f"Сделка #{chat.conversation_id} одобрена модератором {request.user.get_full_name()}",
            status=MessageStatuses.objects.get(status_name="sent"),
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )
        message.save()
    logger.info(f"Сделка {chat_id} одобрена модератором {request.user.user_id}")
    return JsonResponse({"success": True, "message": "Сделка одобрена"})
@login_required
def reject_deal(request, chat_id):
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Неверный метод запроса"}, status=405
        )
    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists() or (
        request.user.role and request.user.role.role_name != "moderator"
    ):
        return JsonResponse(
            {"success": False, "error": "У вас нет прав для этого действия"}, status=403
        )
    if not chat.is_deal:
        return JsonResponse({"success": False, "error": "Это не сделка"}, status=400)
    with transaction.atomic():
        chat.deal_status = "rejected"
        chat.updated_at = timezone.now()
        chat.save()
        message = Messages(
            conversation=chat,
            sender=None,
            message_text=f"Сделка #{chat.conversation_id} отклонена модератором {request.user.get_full_name()}",
            status=MessageStatuses.objects.get(status_name="sent"),
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )
        message.save()
    logger.info(f"Сделка {chat_id} отклонена модератором {request.user.user_id}")
    return JsonResponse({"success": True, "message": "Сделка отклонена"})
@login_required
def create_startup(request):
    allowed_roles = ["startuper", "moderator"]
    if not hasattr(request.user, "role") or request.user.role.role_name.lower() not in allowed_roles:
        messages.error(request, "Доступ к созданию стартапа разрешён только пользователям с ролью 'Стартаппер' или 'Модератор'.")
        return redirect("home")
    if request.method == "POST":
        form = StartupForm(request.POST, request.FILES)
        if form.is_valid():
            startup = form.save(commit=False)
            startup.owner = request.user
            startup.created_at = timezone.now()
            startup.updated_at = timezone.now()
            startup.status = "pending"
            try:
                startup.status_id = ReviewStatuses.objects.get(status_name="Pending")
            except ReviewStatuses.DoesNotExist:
                logger.error("Статус 'Pending' не найден в базе данных.")
                messages.error(request, "Статус 'Pending' не найден в базе данных.")
                return render(
                    request,
                    "accounts/create_startup.html",
                    {"form": form, "timeline_steps": request.POST},
                )
            investment_type = form.cleaned_data.get("investment_type")
            if investment_type == "invest":
                startup.only_invest = True
                startup.only_buy = False
                startup.both_mode = False
            elif investment_type == "buy":
                startup.only_invest = False
                startup.only_buy = True
                startup.both_mode = False
            elif investment_type == "both":
                startup.only_invest = False
                startup.only_buy = False
                startup.both_mode = True
            startup.step_number = int(request.POST.get("step_number", 1))
            startup.planet_image = form.cleaned_data.get("planet_image")
            logger.info("Сохранение стартапа перед обработкой файлов...")
            startup.save()
            logger.info(f"Стартап сохранен, startup_id: {startup.startup_id}")
            if not startup.startup_id:
                logger.error("Ошибка: startup_id не сгенерирован после сохранения!")
                messages.error(
                    request,
                    "Произошла ошибка при создании стартапа: ID не сгенерирован.",
                )
                return render(
                    request,
                    "accounts/create_startup.html",
                    {"form": form, "timeline_steps": request.POST},
                )
            for i in range(1, 6):
                description = request.POST.get(f"step_description_{i}", "").strip()
                if description:
                    StartupTimeline.objects.create(
                        startup=startup,
                        step_number=i,
                        title=f"Этап {i}",
                        description=description,
                    )
            logo_ids = []
            creatives_ids = []
            proofs_ids = []
            video_ids = []
            logo = form.cleaned_data.get("logo")
            if logo:
                logo_id = str(uuid.uuid4())
                base_name = os.path.splitext(logo.name)[0]
                ext = os.path.splitext(logo.name)[1]
                safe_base_name = "".join(
                    c for c in base_name if c.isalnum() or c in ("-", "_")
                )
                safe_name = slugify(safe_base_name) + ext
                file_path = f"startups/{startup.startup_id}/logos/{logo_id}_{safe_name}"
                logo_type, _ = FileTypes.objects.get_or_create(type_name="logo")
                entity_type, _ = EntityTypes.objects.get_or_create(type_name="startup")
                try:
                    logger.info(f"Попытка сохранить логотип по пути: {file_path}")
                    default_storage.save(file_path, logo)
                    logger.info(f"Логотип успешно сохранён по пути: {file_path}")
                    logo_ids.append(logo_id)
                    FileStorage.objects.create(
                        entity_type=entity_type,
                        entity_id=startup.startup_id,
                        file_type=logo_type,
                        file_url=logo_id,
                        uploaded_at=timezone.now(),
                        startup=startup,
                    )
                    logger.info(f"Логотип сохранён: {file_path}")
                except Exception as e:
                    logger.error(f"Ошибка сохранения логотипа: {e}", exc_info=True)
                    messages.warning(
                        request, "Не удалось сохранить логотип, но стартап создан."
                    )
            creatives = form.cleaned_data.get("creatives", [])
            if creatives:
                creative_type, _ = FileTypes.objects.get_or_create(type_name="creative")
                entity_type, _ = EntityTypes.objects.get_or_create(type_name="startup")
                for creative_file in creatives:
                    if not hasattr(creative_file, "name"):
                        logger.warning(f"Пропущен креатив: {creative_file}")
                        continue
                    unique_filename = get_unique_filename(creative_file.name, startup.startup_id, "creative")
                    creative_id = str(uuid.uuid4())
                    base_name = os.path.splitext(creative_file.name)[0]
                    ext = os.path.splitext(creative_file.name)[1]
                    safe_base_name = "".join(
                        c for c in base_name if c.isalnum() or c in ("-", "_")
                    )
                    safe_name = slugify(safe_base_name) + ext
                    file_path = f"startups/{startup.startup_id}/creatives/{creative_id}_{safe_name}"
                    try:
                        logger.info(f"Попытка сохранить креатив по пути: {file_path}")
                        default_storage.save(file_path, creative_file)
                        logger.info(f"Креатив успешно сохранён по пути: {file_path}")
                        creatives_ids.append(creative_id)
                        safe_create_file_storage(
                            entity_type=entity_type,
                            entity_id=startup.startup_id,
                            file_type=creative_type,
                            file_url=creative_id,
                            uploaded_at=timezone.now(),
                            startup=startup,
                            original_file_name=unique_filename,
                        )
                        logger.info(f"Креатив сохранён: {file_path}")
                    except Exception as e:
                        logger.error(f"Ошибка сохранения креатива: {e}", exc_info=True)
                        messages.warning(
                            request,
                            "Не удалось сохранить один из креативов, но стартап создан.",
                        )
            proofs = form.cleaned_data.get("proofs", [])
            if proofs:
                proof_type, _ = FileTypes.objects.get_or_create(type_name="proof")
                entity_type, _ = EntityTypes.objects.get_or_create(type_name="startup")
                for proof_file in proofs:
                    if not hasattr(proof_file, "name"):
                        logger.warning(f"Пропущен пруф: {proof_file}")
                        continue
                    unique_filename = get_unique_filename(proof_file.name, startup.startup_id, "proof")
                    proof_id = str(uuid.uuid4())
                    base_name = os.path.splitext(proof_file.name)[0]
                    ext = os.path.splitext(proof_file.name)[1]
                    safe_base_name = "".join(
                        c for c in base_name if c.isalnum() or c in ("-", "_")
                    )
                    safe_name = slugify(safe_base_name) + ext
                    file_path = (
                        f"startups/{startup.startup_id}/proofs/{proof_id}_{safe_name}"
                    )
                    try:
                        logger.info(f"Попытка сохранить пруф по пути: {file_path}")
                        default_storage.save(file_path, proof_file)
                        logger.info(f"Пруф успешно сохранён по пути: {file_path}")
                        proofs_ids.append(proof_id)
                        safe_create_file_storage(
                            entity_type=entity_type,
                            entity_id=startup.startup_id,
                            file_type=proof_type,
                            file_url=proof_id,
                            uploaded_at=timezone.now(),
                            startup=startup,
                            original_file_name=unique_filename,
                        )
                        logger.info(f"Пруф сохранён: {file_path}, оригинальное название: {unique_filename}")
                    except Exception as e:
                        logger.error(f"Ошибка сохранения пруфа: {e}", exc_info=True)
                        messages.warning(
                            request,
                            "Не удалось сохранить один из пруфов, но стартап создан.",
                        )
            video = form.cleaned_data.get("video")
            if video:
                unique_filename = get_unique_filename(video.name, startup.startup_id, "video")
                video_id = str(uuid.uuid4())
                base_name = os.path.splitext(video.name)[0]
                ext = os.path.splitext(video.name)[1]
                safe_base_name = "".join(
                    c for c in base_name if c.isalnum() or c in ("-", "_")
                )
                safe_name = slugify(safe_base_name) + ext
                file_path = (
                    f"startups/{startup.startup_id}/videos/{video_id}_{safe_name}"
                )
                video_type, _ = FileTypes.objects.get_or_create(type_name="video")
                entity_type, _ = EntityTypes.objects.get_or_create(type_name="startup")
                try:
                    logger.info(f"Попытка сохранить видео по пути: {file_path}")
                    default_storage.save(file_path, video)
                    logger.info(f"Видео успешно сохранено по пути: {file_path}")
                    video_ids.append(video_id)
                    safe_create_file_storage(
                        entity_type=entity_type,
                        entity_id=startup.startup_id,
                        file_type=video_type,
                        file_url=video_id,
                        uploaded_at=timezone.now(),
                        startup=startup,
                        original_file_name=unique_filename,
                    )
                    logger.info(f"Видео сохранено: {file_path}")
                except Exception as e:
                    logger.error(f"Ошибка сохранения видео: {e}", exc_info=True)
                    messages.warning(
                        request, "Не удалось сохранить видео, но стартап создан."
                    )
            startup.logo_urls = logo_ids
            startup.creatives_urls = creatives_ids
            startup.proofs_urls = proofs_ids
            startup.video_urls = video_ids
            startup.save()
            logger.info(
                f"Стартап создан: ID={startup.startup_id}, Planet={startup.planet_image}"
            )
            messages.success(
                request,
                f'Стартап "{startup.title}" успешно создан и отправлен на модерацию!',
            )
            return redirect("startup_creation_success")
        else:
            messages.error(request, "Форма содержит ошибки.")
            return render(
                request,
                "accounts/create_startup.html",
                {"form": form, "timeline_steps": request.POST},
            )
    else:
        form = StartupForm()
    return render(request, "accounts/create_startup.html", {"form": form})
@login_required
def startup_creation_success(request):
    return render(request, "accounts/startup_creation_success.html")
@login_required
def delete_message(request, message_id):
    message = get_object_or_404(Messages, message_id=message_id)
    chat = message.conversation
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse(
            {"success": False, "error": "У вас нет доступа к этому чату"}, status=403
        )
    if request.user.role and request.user.role.role_name.lower() == "moderator":
        message.is_deleted = True
        message.save()
        return JsonResponse({"success": True})
    return JsonResponse(
        {"success": False, "error": "Только модератор может удалить сообщение"},
        status=403,
    )
@login_required
def remove_participant(request, chat_id):
    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse(
            {"success": False, "error": "У вас нет доступа к этому чату"}, status=403
        )
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Неверный метод запроса"}, status=405
        )
    user_id = request.POST.get("user_id")
    if not user_id:
        return JsonResponse(
            {"success": False, "error": "Не указан пользователь"}, status=400
        )
    try:
        user_to_remove = Users.objects.get(user_id=user_id)
    except Users.DoesNotExist:
        return JsonResponse(
            {"success": False, "error": "Пользователь не найден"}, status=404
        )
    if (
        request.user.role
        and request.user.role.role_name.lower() == "moderator"
        and chat.is_group_chat
    ):
        participant = chat.chatparticipants_set.filter(user=user_to_remove).first()
        if participant:
            participant.delete()
            chat.updated_at = timezone.now()
            chat.save()
            return JsonResponse({"success": True})
    return JsonResponse(
        {
            "success": False,
            "error": "Только модератор может исключить участника из группового чата",
        },
        status=403,
    )
@login_required
def edit_startup(request, startup_id):
    logger.debug(f"Request method: {request.method}")
    logger.debug(f"Request POST: {request.POST}")
    logger.debug(f"Request FILES: {dict(request.FILES)}")
    startup = get_object_or_404(Startups, startup_id=startup_id)
    if not (
        request.user == startup.owner
        or (
            hasattr(request.user, "role")
            and request.user.role
            and request.user.role.role_name == "moderator"
        )
    ):
        messages.error(request, "У вас нет прав для редактирования этого стартапа.")
        return redirect("startup_detail", startup_id=startup_id)
    timeline = StartupTimeline.objects.filter(startup=startup)
    timeline_steps = timeline
    if request.method == "POST":
        form = StartupForm(request.POST, request.FILES, instance=startup)
        if form.is_valid():
            startup = form.save(commit=False)
            startup.status = "pending"
            startup.is_edited = True
            startup.updated_at = timezone.now()
            if "step_number" in request.POST:
                new_step = int(request.POST.get("step_number"))
                startup.step_number = new_step
            investment_type = form.cleaned_data.get("investment_type")
            if investment_type == "invest":
                startup.only_invest = True
                startup.only_buy = False
                startup.both_mode = False
            elif investment_type == "buy":
                startup.only_invest = False
                startup.only_buy = True
                startup.both_mode = False
            elif investment_type == "both":
                startup.only_invest = False
                startup.only_buy = False
                startup.both_mode = True
            startup.save()
            deleted_files_json = request.POST.get('deleted_files', '[]')
            try:
                deleted_files = json.loads(deleted_files_json)
                for deleted_file in deleted_files:
                    file_id = deleted_file.get('id')
                    file_type = deleted_file.get('type')
                    if file_id and file_type:
                        FileStorage.objects.filter(
                            startup=startup,
                            file_url=file_id
                        ).delete()
                        if file_type == 'creative' and startup.creatives_urls:
                            startup.creatives_urls = [url for url in startup.creatives_urls if url != file_id]
                        elif file_type == 'proof' and startup.proofs_urls:
                            startup.proofs_urls = [url for url in startup.proofs_urls if url != file_id]
                        elif file_type == 'video' and startup.video_urls:
                            startup.video_urls = [url for url in startup.video_urls if url != file_id]
                        logger.info(f"Удален файл {file_type}: {file_id}")
            except json.JSONDecodeError:
                logger.warning("Ошибка при разборе deleted_files JSON")
            for i in range(1, 6):
                description = request.POST.get(f"step_description_{i}", "").strip()
                if description:
                    timeline_entry, created = StartupTimeline.objects.get_or_create(
                        startup=startup,
                        step_number=i,
                        defaults={"title": f"Этап {i}", "description": description},
                    )
                    if not created and timeline_entry.description != description:
                        timeline_entry.description = description
                        timeline_entry.save()
            logo_ids = startup.logo_urls or []
            creatives_ids = startup.creatives_urls or []
            proofs_ids = startup.proofs_urls or []
            video_ids = startup.video_urls or []
            logo = form.cleaned_data.get("logo")
            if logo:
                logo_id = str(uuid.uuid4())
                file_path = f"startups/{startup.startup_id}/logos/{logo_id}_{logo.name}"
                default_storage.save(file_path, logo)
                logo_ids = [logo_id]
                logger.info(f"Логотип сохранён с ID: {logo_id}")
            creatives = form.cleaned_data.get("creatives", [])
            if creatives:
                creative_type = FileTypes.objects.get(type_name="creative")
                entity_type = EntityTypes.objects.get(type_name="startup")
                creatives_ids = []
                for creative_file in creatives:
                    if not hasattr(creative_file, "name"):
                        logger.warning(
                            f"Пропущен креатив, так как это не файл: {creative_file}"
                        )
                        continue
                    unique_filename = get_unique_filename(creative_file.name, startup.startup_id, "creative")
                    creative_id = str(uuid.uuid4())
                    file_path = f"startups/{startup.startup_id}/creatives/{creative_id}_{creative_file.name}"
                    default_storage.save(file_path, creative_file)
                    creatives_ids.append(creative_id)
                    safe_create_file_storage_instance(
                        entity_type=entity_type,
                        entity_id=startup.startup_id,
                        file_type=creative_type,
                        file_url=creative_id,
                        uploaded_at=timezone.now(),
                        startup=startup,
                        original_file_name=unique_filename,
                    )
                    logger.info(f"Креатив сохранён с ID: {creative_id}")
            proofs = form.cleaned_data.get("proofs", [])
            if proofs:
                proof_type = FileTypes.objects.get(type_name="proof")
                entity_type = EntityTypes.objects.get(type_name="startup")
                proofs_ids = []
                for proof_file in proofs:
                    if not hasattr(proof_file, "name"):
                        logger.warning(
                            f"Пропущен пруф, так как это не файл: {proof_file}"
                        )
                        continue
                    unique_filename = get_unique_filename(proof_file.name, startup.startup_id, "proof")
                    proof_id = str(uuid.uuid4())
                    file_path = f"startups/{startup.startup_id}/proofs/{proof_id}_{proof_file.name}"
                    default_storage.save(file_path, proof_file)
                    proofs_ids.append(proof_id)
                    safe_create_file_storage_instance(
                        entity_type=entity_type,
                        entity_id=startup.startup_id,
                        file_type=proof_type,
                        file_url=proof_id,
                        uploaded_at=timezone.now(),
                        startup=startup,
                        original_file_name=unique_filename,
                    )
                    logger.info(f"Пруф сохранён с ID: {proof_id}")
            video = form.cleaned_data.get("video")
            if video:
                unique_filename = get_unique_filename(video.name, startup.startup_id, "video")
                video_id = str(uuid.uuid4())
                file_path = (
                    f"startups/{startup.startup_id}/videos/{video_id}_{video.name}"
                )
                default_storage.save(file_path, video)
                video_ids = [video_id]
                video_type, _ = FileTypes.objects.get_or_create(type_name="video")
                entity_type = EntityTypes.objects.get(type_name="startup")
                safe_create_file_storage_instance(
                    entity_type=entity_type,
                    entity_id=startup.startup_id,
                    file_type=video_type,
                    file_url=video_id,
                    uploaded_at=timezone.now(),
                    startup=startup,
                    original_file_name=unique_filename,
                )
                logger.info(f"Видео сохранено с ID: {video_id}")
            startup.logo_urls = logo_ids
            startup.creatives_urls = creatives_ids
            startup.proofs_urls = proofs_ids
            startup.video_urls = video_ids
            startup.save()
            logger.info("=== Обновление стартапа ===")
            logger.info(f"Стартап ID: {startup.startup_id}")
            if logo:
                logger.info(f"Логотип: {logo.name}, размер: {logo.size} байт")
                logger.info(
                    f"ID логотипа: {logo_ids[0] if logo_ids else 'Не сохранён'}"
                )
            else:
                logger.info("Логотип не загружен")
            if creatives:
                logger.info(f"Креативы: {len(creatives)} файлов")
                for i, creative_file in enumerate(creatives, 1):
                    if hasattr(creative_file, "name"):
                        logger.info(
                            f"Креатив {i}: {creative_file.name}, размер: {creative_file.size} байт"
                        )
                    else:
                        logger.info(
                            f"Креатив {i}: Неверный формат (не файл): {creative_file}"
                        )
            else:
                logger.info("Креативы не загружены")
            if proofs:
                logger.info(f"Пруфы: {len(proofs)} файлов")
                for i, proof_file in enumerate(proofs, 1):
                    if hasattr(proof_file, "name"):
                        logger.info(
                            f"Пруф {i}: {proof_file.name}, размер: {proof_file.size} байт"
                        )
                    else:
                        logger.info(
                            f"Пруф {i}: Неверный формат (не файл): {proof_file}"
                        )
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
            logger.info(
                f"AWS_ACCESS_KEY_ID: {getattr(settings, 'AWS_ACCESS_KEY_ID', 'Не задано')}"
            )
            logger.info(
                f"AWS_SECRET_ACCESS_KEY: {getattr(settings, 'AWS_SECRET_ACCESS_KEY', 'Не задано')}"
            )
            logger.info(
                f"AWS_STORAGE_BUCKET_NAME: {getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'Не задано')}"
            )
            logger.info(
                f"AWS_S3_ENDPOINT_URL: {getattr(settings, 'AWS_S3_ENDPOINT_URL', 'Не задано')}"
            )
            logger.info(
                f"AWS_DEFAULT_ACL: {getattr(settings, 'AWS_DEFAULT_ACL', 'Не задано')}"
            )
            logger.info("=== Проверка STORAGES ===")
            logger.info(
                f"STORAGES['default']['BACKEND']: {settings.STORAGES['default']['BACKEND']}"
            )
            logger.info(f"default_storage: {default_storage.__class__.__name__}")
            logger.info("=== Проверка подключения к Yandex Object Storage ===")
            try:
                from django.core.files.base import ContentFile
                from storages.backends.s3boto3 import S3Boto3Storage
                storage = S3Boto3Storage()
                test_file_name = f"test/test_file_{startup.startup_id}.txt"
                test_content = (
                    "This is a test file to check Yandex Object Storage connection."
                )
                test_file = ContentFile(test_content.encode("utf-8"))
                storage.save(test_file_name, test_file)
                logger.info(f"Тестовый файл успешно сохранён: {test_file_name}")
                test_file_url = storage.url(test_file_name)
                logger.info(f"URL тестового файла: {test_file_url}")
                storage.delete(test_file_name)
                logger.info(f"Тестовый файл удалён: {test_file_name}")
            except Exception as e:
                logger.error(
                    f"Ошибка подключения к Yandex Object Storage: {str(e)}",
                    exc_info=True,
                )
            messages.success(
                request,
                f'Стартап "{startup.title}" успешно отредактирован и отправлен на модерацию!',
            )
            return redirect("profile")
        else:
            messages.error(request, "Форма содержит ошибки.")
            return render(
                request,
                "accounts/edit_startup.html",
                {
                    "form": form,
                    "startup": startup,
                    "timeline_steps": timeline_steps,
                },
            )
    else:
        form = StartupForm(instance=startup)
    return render(
        request,
        "accounts/edit_startup.html",
        {
            "form": form,
            "startup": startup,
            "timeline_steps": timeline_steps,
        },
    )
@login_required
def main_page_moderator(request):
    """
    Отображает главную страницу для модератора.
    """
    if not request.user.role or request.user.role.role_name != "moderator":
        return redirect("home")
    return render(request, "accounts/moderator_main.html")
@login_required
def investor_main(request):
    """
    Отображает главную страницу инвестора с планетарной системой стартапов.
    """
    directions_data_json = FIXED_CATEGORIES.copy()
    selected_direction_name = request.GET.get("direction", "All")
    startups_query = Startups.objects.filter(status="approved").annotate(
        rating_avg=Coalesce(Avg("uservotes__rating"), 0.0, output_field=FloatField()),
        voters_count=Count("uservotes", distinct=True),
        total_investors=Count("investmenttransactions", distinct=True),
        current_funding=Coalesce(
            Sum("investmenttransactions__amount"), 0, output_field=DecimalField()
        ),
        comment_count=Count("comments", distinct=True),
    )
    if selected_direction_name != "All" and selected_direction_name != "Все":
        startups_query = startups_query.filter(
            direction__direction_name=selected_direction_name
        )
    startups_filtered = startups_query.annotate(
        progress=Case(
            When(funding_goal__gt=0, then=(F("amount_raised") * 100.0 / F("funding_goal"))),
            default=Value(0),
            output_field=FloatField(),
        )
    )[:6]
    planets_data_for_template = []
    fixed_orbit_sizes = [200, 300, 400, 500, 600, 700]
    orbit_times = [80, 95, 110, 125, 140, 160]
    planet_sizes = [60, 70, 56, 64, 50, 60]
    import random
    for idx, startup in enumerate(startups_filtered):
        random_planet_num = random.randint(1, 15)
        image_path = f"accounts/images/planetary_system/planets_round/{random_planet_num}.png"
        planets_data_for_template.append(
            {
                "id": startup.startup_id,
                "image": static(image_path),
                "orbit_size": fixed_orbit_sizes[idx],
                "orbit_time": orbit_times[idx],
                "planet_size": planet_sizes[idx],
            }
        )
    planets_data_json = []
    for startup in startups_filtered:
        investment_type = (
            "Инвестирование"
            if startup.only_invest
            else "Выкуп"
            if startup.only_buy
            else "Выкуп+инвестирование"
            if startup.both_mode
            else "Не указано"
        )
        random_planet_num = random.randint(1, 8)
        planet_image_url = static(f"accounts/images/planetary_system/planets_round/{random_planet_num}.png")
        planets_data_json.append({
            "id": startup.startup_id,
            "name": startup.title,
            "image": planet_image_url,
            "rating": round(startup.rating_avg, 2),
            "progress": f"{startup.progress:.2f}%" if startup.progress is not None else "0%",
            "direction": startup.direction.direction_name if startup.direction else "Не указано",
            "investors": startup.total_investors,
            "funding_goal": f"{startup.funding_goal:,.0f} ₽".replace(",", " ") if startup.funding_goal else "Не определена",
            "comment_count": startup.comment_count,
            "startup_id": startup.startup_id,
            "description": startup.short_description,
            "investment_type": investment_type,
        })
    is_authenticated = request.user.is_authenticated
    is_startuper = is_authenticated and hasattr(request.user, 'role') and request.user.role and request.user.role.role_name == 'startuper'
    logo_data = {"image": static("accounts/images/planetary_system/gi.svg")}
    all_startups_query = Startups.objects.filter(status="approved").annotate(
        rating_avg=Coalesce(Avg("uservotes__rating"), 0.0, output_field=FloatField()),
        voters_count=Count("uservotes", distinct=True),
        total_investors=Count("investmenttransactions", distinct=True),
        current_funding=Coalesce(
            Sum("investmenttransactions__amount"), 0, output_field=DecimalField()
        ),
        comment_count=Count("comments", distinct=True),
        progress=Case(
            When(funding_goal__gt=0, then=(F("amount_raised") * 100.0 / F("funding_goal"))),
            default=Value(0),
            output_field=FloatField(),
        )
    )
    all_startups_data = []
    for startup in all_startups_query:
        investment_type = (
            "Инвестирование"
            if startup.only_invest
            else "Выкуп"
            if startup.only_buy
            else "Выкуп+инвестирование"
            if startup.both_mode
            else "Не указано"
        )
        random_planet_num = random.randint(1, 15)
        planet_image_url = static(f"accounts/images/planetary_system/planets_round/{random_planet_num}.png")
        direction_name = startup.direction.direction_name if startup.direction else "Не указано"
        russian_direction = DIRECTION_TRANSLATIONS.get(direction_name, direction_name)
        all_startups_data.append({
            "id": startup.startup_id,
            "name": startup.title,
            "image": planet_image_url,
            "rating": round(startup.rating_avg, 2),
            "voters_count": startup.voters_count,
            "progress": round(startup.progress, 2) if startup.progress is not None else 0,
            "direction": russian_direction,
            "investors": startup.total_investors,
            "funding_goal": f"{startup.funding_goal:,.0f} ₽".replace(",", " ") if startup.funding_goal else "Не определена",
            "valuation": f"{startup.valuation:,.0f} ₽".replace(",", " ") if startup.valuation else "Не указана",
            "comment_count": startup.comment_count,
            "startup_id": startup.startup_id,
            "description": startup.short_description,
            "investment_type": investment_type,
        })
    context = {
        "planets_data": planets_data_for_template,
        "logo_data": logo_data,
        "directions": directions_data_json,
        "selected_galaxy": selected_direction_name,
        "planets_data_json": json.dumps(planets_data_json, cls=DjangoJSONEncoder),
        "directions_data_json": json.dumps(directions_data_json, cls=DjangoJSONEncoder),
        "all_startups_data_json": json.dumps(all_startups_data, cls=DjangoJSONEncoder),
        "is_startuper": is_startuper,
    }
    return render(request, "accounts/investor_main.html", context)
@login_required
def startupper_main(request):
    """
    Отображает главную страницу стартаппера с планетарной системой стартапов.
    """
    directions_data_json = FIXED_CATEGORIES.copy()
    selected_direction_name = request.GET.get("direction", "All")
    startups_query = Startups.objects.filter(status="approved").annotate(
        rating_avg=Coalesce(Avg("uservotes__rating"), 0.0, output_field=FloatField()),
        voters_count=Count("uservotes", distinct=True),
        total_investors=Count("investmenttransactions", distinct=True),
        current_funding=Coalesce(
            Sum("investmenttransactions__amount"), 0, output_field=DecimalField()
        ),
        comment_count=Count("comments", distinct=True),
    )
    if selected_direction_name != "All" and selected_direction_name != "Все":
        startups_query = startups_query.filter(
            direction__direction_name=selected_direction_name
        )
    startups_filtered = startups_query.annotate(
        progress=Case(
            When(funding_goal__gt=0, then=(F("amount_raised") * 100.0 / F("funding_goal"))),
            default=Value(0),
            output_field=FloatField(),
        )
    )[:6]
    planets_data_for_template = []
    fixed_orbit_sizes = [200, 300, 400, 500, 600, 700]
    orbit_times = [80, 95, 110, 125, 140, 160]
    planet_sizes = [60, 70, 56, 64, 50, 60]
    import random
    for idx, startup in enumerate(startups_filtered):
        random_planet_num = random.randint(1, 15)
        image_path = f"accounts/images/planetary_system/planets_round/{random_planet_num}.png"
        planets_data_for_template.append(
            {
                "id": startup.startup_id,
                "image": static(image_path),
                "orbit_size": fixed_orbit_sizes[idx],
                "orbit_time": orbit_times[idx],
                "planet_size": planet_sizes[idx],
            }
        )
    planets_data_json = []
    for startup in startups_filtered:
        investment_type = (
            "Инвестирование"
            if startup.only_invest
            else "Выкуп"
            if startup.only_buy
            else "Выкуп+инвестирование"
            if startup.both_mode
            else "Не указано"
        )
        random_planet_num = random.randint(1, 8)
        planet_image_url = static(f"accounts/images/planetary_system/planets_round/{random_planet_num}.png")
        planets_data_json.append({
            "id": startup.startup_id,
            "name": startup.title,
            "image": planet_image_url,
            "rating": round(startup.rating_avg, 2),
            "progress": f"{startup.progress:.2f}%" if startup.progress is not None else "0%",
            "direction": startup.direction.direction_name if startup.direction else "Не указано",
            "investors": startup.total_investors,
            "funding_goal": f"{startup.funding_goal:,.0f} ₽".replace(",", " ") if startup.funding_goal else "Не определена",
            "comment_count": startup.comment_count,
            "startup_id": startup.startup_id,
            "description": startup.short_description,
            "investment_type": investment_type,
        })
    is_authenticated = request.user.is_authenticated
    is_startuper = is_authenticated and hasattr(request.user, 'role') and request.user.role and request.user.role.role_name == 'startuper'
    logo_data = {"image": static("accounts/images/planetary_system/gi.svg")}
    all_startups_query = Startups.objects.filter(status="approved").annotate(
        rating_avg=Coalesce(Avg("uservotes__rating"), 0.0, output_field=FloatField()),
        voters_count=Count("uservotes", distinct=True),
        total_investors=Count("investmenttransactions", distinct=True),
        current_funding=Coalesce(
            Sum("investmenttransactions__amount"), 0, output_field=DecimalField()
        ),
        comment_count=Count("comments", distinct=True),
        progress=Case(
            When(funding_goal__gt=0, then=(F("amount_raised") * 100.0 / F("funding_goal"))),
            default=Value(0),
            output_field=FloatField(),
        )
    )
    all_startups_data = []
    for startup in all_startups_query:
        investment_type = (
            "Инвестирование"
            if startup.only_invest
            else "Выкуп"
            if startup.only_buy
            else "Выкуп+инвестирование"
            if startup.both_mode
            else "Не указано"
        )
        random_planet_num = random.randint(1, 15)
        planet_image_url = static(f"accounts/images/planetary_system/planets_round/{random_planet_num}.png")
        direction_name = startup.direction.direction_name if startup.direction else "Не указано"
        russian_direction = DIRECTION_TRANSLATIONS.get(direction_name, direction_name)
        all_startups_data.append({
            "id": startup.startup_id,
            "name": startup.title,
            "image": planet_image_url,
            "rating": round(startup.rating_avg, 2),
            "voters_count": startup.voters_count,
            "progress": round(startup.progress, 2) if startup.progress is not None else 0,
            "direction": russian_direction,
            "investors": startup.total_investors,
            "funding_goal": f"{startup.funding_goal:,.0f} ₽".replace(",", " ") if startup.funding_goal else "Не определена",
            "valuation": f"{startup.valuation:,.0f} ₽".replace(",", " ") if startup.valuation else "Не указана",
            "comment_count": startup.comment_count,
            "startup_id": startup.startup_id,
            "description": startup.short_description,
            "investment_type": investment_type,
        })
    context = {
        "planets_data": planets_data_for_template,
        "logo_data": logo_data,
        "directions": directions_data_json,
        "selected_galaxy": selected_direction_name,
        "planets_data_json": json.dumps(planets_data_json, cls=DjangoJSONEncoder),
        "directions_data_json": json.dumps(directions_data_json, cls=DjangoJSONEncoder),
        "all_startups_data_json": json.dumps(all_startups_data, cls=DjangoJSONEncoder),
        "is_startuper": is_startuper,
    }
    return render(request, "accounts/startupper_main.html", context)
def moderator_dashboard(request):
    pending_startups_list = Startups.objects.filter(status="pending")
    all_categories = Directions.objects.all().order_by("direction_name")
    selected_category_name = request.GET.get("category")
    sort_order = request.GET.get("sort")
    filter_type = request.GET.get("filter")
    if filter_type == "all":
        selected_category_name = None
        sort_order = None
    if selected_category_name:
        pending_startups_list = pending_startups_list.filter(
            direction__direction_name__iexact=selected_category_name
        )
    if sort_order == "newest":
        if hasattr(Startups, "created_at"):
            pending_startups_list = pending_startups_list.order_by("-created_at")
        else:
            pending_startups_list = pending_startups_list.order_by(
                "-startup_id"
            )
    else:
        if hasattr(Startups, "created_at"):
            pending_startups_list = pending_startups_list.order_by(
                "-created_at"
            )
        else:
            pending_startups_list = pending_startups_list.order_by("-startup_id")
    context = {
        "pending_startups": pending_startups_list,
        "all_categories": all_categories,
        "selected_category_name": selected_category_name,
        "current_sort_order": sort_order,
        "filter_type": filter_type,
    }
    return render(request, "accounts/moderator_dashboard.html", context)
def approve_startup(request, startup_id):
    if not request.user.is_authenticated or request.user.role.role_name != "moderator":
        messages.error(request, "У вас нет прав для этого действия.")
        return redirect("home")
    startup = get_object_or_404(Startups, startup_id=startup_id)
    if request.method == "POST":
        moderator_comment = request.POST.get("moderator_comment", "")
        startup.moderator_comment = moderator_comment
        startup.status = "approved"
        try:
            startup.status_id = ReviewStatuses.objects.get(status_name="Approved")
        except ReviewStatuses.DoesNotExist:
            raise ValueError("Статус 'Approved' не найден в базе данных.")
        startup.save()
        messages.success(request, "Стартап одобрен.")
    return redirect("moderator_dashboard")
def reject_startup(request, startup_id):
    if not request.user.is_authenticated or request.user.role.role_name != "moderator":
        messages.error(request, "У вас нет прав для этого действия.")
        return redirect("home")
    startup = get_object_or_404(Startups, startup_id=startup_id)
    if request.method == "POST":
        moderator_comment = request.POST.get("moderator_comment", "")
        startup.moderator_comment = moderator_comment
        startup.status = "rejected"
        try:
            startup.status_id = ReviewStatuses.objects.get(status_name="Rejected")
        except ReviewStatuses.DoesNotExist:
            raise ValueError("Статус 'Rejected' не найден в базе данных.")
        startup.save()
        messages.success(request, "Стартап отклонен.")
    return redirect("moderator_dashboard")
@login_required
def vote_startup(request, startup_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Неверный метод запроса"})
    startup = get_object_or_404(Startups, startup_id=startup_id)
    rating = int(request.POST.get("rating", 0))
    if not 1 <= rating <= 5:
        return JsonResponse(
            {"success": False, "error": "Недопустимое значение рейтинга"}
        )
    if UserVotes.objects.filter(user=request.user, startup=startup).exists():
        return JsonResponse(
            {"success": False, "error": "Вы уже голосовали за этот стартап"}
        )
    UserVotes.objects.create(
        user=request.user, startup=startup, rating=rating, created_at=timezone.now()
    )
    startup.total_voters += 1
    startup.sum_votes += rating
    startup.save()
    average_rating = (
        startup.sum_votes / startup.total_voters if startup.total_voters > 0 else 0
    )
    return JsonResponse({"success": True, "average_rating": average_rating})
@login_required
def invest(request, startup_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Неверный метод запроса"})
    startup = get_object_or_404(Startups, startup_id=startup_id)
    if not request.user.is_authenticated or request.user.role.role_name != "investor":
        return JsonResponse(
            {"success": False, "error": "Только инвесторы могут инвестировать"}
        )
    if startup.status in ["blocked", "closed"]:
        return JsonResponse(
            {
                "success": False,
                "error": f"Инвестирование запрещено: стартап {startup.status}",
            }
        )
    try:
        amount = Decimal(request.POST.get("amount", "0"))
        if amount <= 0:
            return JsonResponse(
                {"success": False, "error": "Сумма должна быть больше 0"}
            )
        transaction = InvestmentTransactions(
            startup=startup,
            investor=request.user,
            amount=amount,
            is_micro=startup.micro_investment_available,
            transaction_type=TransactionTypes.objects.get(type_name="investment"),
            transaction_status="completed",
            payment_method=PaymentMethods.objects.get(method_name="default"),
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )
        transaction.save()
        startup.amount_raised = (startup.amount_raised or Decimal("0")) + amount
        startup.total_invested = (startup.total_invested or Decimal("0")) + amount
        startup.save()
        investors_count = startup.get_investors_count()
        progress_percentage = startup.get_progress_percentage()
        return JsonResponse(
            {
                "success": True,
                "amount_raised": float(startup.amount_raised),
                "investors_count": investors_count,
                "progress_percentage": float(progress_percentage),
            }
        )
    except Exception as e:
        logger.error(f"Ошибка при инвестировании: {str(e)}")
        return JsonResponse(
            {"success": False, "error": "Произошла ошибка при инвестировании"}
        )
class NewsForm(forms.Form):
    title = forms.CharField(max_length=255, label="Заголовок")
    content = forms.CharField(widget=forms.Textarea, label="Текст новости")
    image = forms.ImageField(label="Картинка", required=False)
def news(request):
    if request.method == "POST":
        if (
            not request.user.is_authenticated
            or request.user.role.role_name != "moderator"
        ):
            return JsonResponse(
                {"success": False, "error": "У вас нет прав для этого действия."}
            )
        form = NewsForm(request.POST, request.FILES)
        if form.is_valid():
            article = NewsArticles(
                title=form.cleaned_data["title"],
                content=form.cleaned_data["content"],
                author=request.user,
                published_at=timezone.now(),
                updated_at=timezone.now(),
                tags="Администрация",
            )
            article.save()
            image = form.cleaned_data.get("image")
            if image:
                image_id = str(uuid.uuid4())
                file_path = f"news/{article.article_id}/{image_id}_{image.name}"
                default_storage.save(file_path, image)
                article.image_url = file_path
                article.save()
            return JsonResponse({"success": True})
        else:
            return JsonResponse({"success": False, "error": "Форма содержит ошибки."})
    articles = NewsArticles.objects.all().order_by("-published_at")
    return render(request, "accounts/news.html", {"articles": articles})
def news_detail(request, article_id):
    article = get_object_or_404(NewsArticles, article_id=article_id)
    user = request.user if request.user.is_authenticated else None
    if not NewsViews.objects.filter(article=article, user=user).exists():
        NewsViews.objects.create(article=article, user=user, viewed_at=timezone.now())
    views_count = NewsViews.objects.filter(article=article).count()
    likes_count = NewsLikes.objects.filter(article=article).count()
    user_liked = (
        NewsLikes.objects.filter(article=article, user=user).exists() if user else False
    )
    if (
        request.method == "POST"
        and request.user.is_authenticated
        and "like" in request.POST
    ):
        if not user_liked:
            NewsLikes.objects.create(
                article=article, user=request.user, created_at=timezone.now()
            )
            likes_count += 1
            user_liked = True
    return render(
        request,
        "accounts/news_detail.html",
        {
            "article": article,
            "views_count": views_count,
            "likes_count": likes_count,
            "user_liked": user_liked,
        },
    )
@login_required
def create_news(request):
    if not request.user.is_authenticated or request.user.role.role_name != "moderator":
        messages.error(request, "У вас нет прав для этого действия.")
        return redirect("news")
    if request.method == "POST":
        form = NewsForm(request.POST, request.FILES)
        if form.is_valid():
            article = NewsArticles(
                title=form.cleaned_data["title"],
                content=form.cleaned_data["content"],
                author=request.user,
                published_at=timezone.now(),
                updated_at=timezone.now(),
                tags="Администрация",
            )
            image = form.cleaned_data.get("image")
            if image:
                image_id = str(uuid.uuid4())
                file_path = f"news/{image_id}_{image.name}"
                default_storage.save(file_path, image)
                article.image_url = file_path
            article.save()
            messages.success(request, "Новость успешно создана!")
            return redirect("news")
    else:
        form = NewsForm()
    return render(request, "accounts/create_news.html", {"form": form})
def delete_news(request, article_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Неверный метод запроса"})
    if not request.user.is_authenticated or request.user.role.role_name != "moderator":
        return JsonResponse(
            {"success": False, "error": "У вас нет прав для этого действия."}
        )
    article = get_object_or_404(NewsArticles, article_id=article_id)
    if article.image_url:
        try:
            default_storage.delete(article.image_url)
        except Exception as e:
            logger.error(f"Ошибка при удалении картинки новости {article_id}: {str(e)}")
    article.delete()
    return JsonResponse({"success": True})
@login_required
def cosmochat(request):
    if not request.user.is_authenticated:
        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            return JsonResponse(
                {"success": False, "error": "Требуется авторизация"}, status=401
            )
        messages.error(
            request, "Пожалуйста, войдите в систему, чтобы получить доступ к чату."
        )
        return redirect("login")
    chats = (
        ChatConversations.objects.filter(chatparticipants__user=request.user)
        .prefetch_related(
            "chatparticipants_set__user"
        )
        .annotate(
            latest_message_time=Max("messages__created_at")
        )
        .order_by(F("latest_message_time").desc(nulls_last=True), "-updated_at")
    )
    for chat in chats:
        if chat.is_group_chat:
            chat.display_name = chat.name
            chat.display_avatar = None
        else:
            other_participant = None
            for p in chat.chatparticipants_set.all():
                if p.user_id != request.user.user_id:
                    other_participant = p
                    break
            if other_participant and other_participant.user:
                user_profile = other_participant.user
                chat.display_name = f"{user_profile.first_name or ''} {user_profile.last_name or ''}".strip()
                chat.display_avatar = user_profile.get_profile_picture_url()
            else:
                chat.display_name = "Удаленный чат"
                chat.display_avatar = None
    search_form = UserSearchForm(request.GET)
    users = Users.objects.all()
    if search_form.is_valid():
        query = search_form.cleaned_data.get("query", "")
        roles = search_form.cleaned_data.get("roles", [])
        if query:
            users = users.filter(
                Q(email__icontains=query)
                | Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
            )
        if roles:
            users = users.filter(role__role_name__in=roles)
    users = users.exclude(user_id=request.user.user_id)
    chat_id = request.GET.get("chat_id")
    if chat_id:
        chat = ChatConversations.objects.filter(conversation_id=chat_id).first()
        if chat:
            participant_ids = chat.chatparticipants_set.values_list(
                "user_id", flat=True
            )
            users = users.exclude(user_id__in=participant_ids)
        else:
            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse(
                    {"success": False, "error": "Чат не найден"}, status=404
                )
    for user in users[:5]:
        profile_url = (
            user.get_profile_picture_url() if user.profile_picture_url else "None"
        )
        logger.info(
            f"Cosmochat User ID: {user.user_id}, Profile Picture URL: {user.profile_picture_url}, Generated URL: {profile_url}"
        )
    for chat in chats[:5]:
        participants = chat.chatparticipants_set.all()
        participant_info = [
            f"ID: {p.user.user_id}, Picture: {p.user.get_profile_picture_url() or 'None'}"
            for p in participants
            if p.user and p.user != request.user
        ]
        logger.info(
            f"Chat ID: {chat.conversation_id}, Participants (excluding self): {participant_info}"
        )
    message_form = MessageForm()
    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        users_data = [
            {
                "user_id": user.user_id,
                "name": f"{user.first_name} {user.last_name}",
                "role": user.role.role_name if user.role else "Система",
            }
            for user in users
        ]
        return JsonResponse({"users": users_data})
    return render(
        request,
        "accounts/cosmochat.html",
        {
            "search_form": search_form,
            "users": users,
            "chats": chats,
            "message_form": message_form,
        },
    )
def get_chat_messages(request, chat_id):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "Требуется авторизация"})
    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse(
            {"success": False, "error": "У вас нет доступа к этому чату"}
        )
    since = request.GET.get("since")
    messages = chat.messages_set.all()
    if since:
        try:
            from datetime import datetime
            since_dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
            messages = messages.filter(created_at__gt=since_dt)
        except ValueError:
            return JsonResponse(
                {"success": False, "error": "Неверный формат параметра since"}
            )
    messages = messages.order_by("created_at")
    messages_data = [
        {
            "message_id": msg.message_id,
            "sender_id": msg.sender.user_id if msg.sender else None,
            "sender_name": (
                f"{msg.sender.first_name} {msg.sender.last_name}"
                if msg.sender
                else "Неизвестно"
            ),
            "message_text": msg.message_text,
            "created_at": (
                msg.created_at.strftime("%d.%m.%Y %H:%M") if msg.created_at else ""
            ),
            "created_at_iso": msg.created_at.isoformat() if msg.created_at else "",
            "is_read": msg.is_read(),
            "is_own": msg.sender == request.user if msg.sender else False,
        }
        for msg in messages
    ]
    participants = chat.get_participants()
    participants_data = [
        {
            "user_id": p.user.user_id,
            "name": f"{p.user.first_name} {p.user.last_name}",
            "role": p.user.role.role_name if p.user.role else "Неизвестно",
        }
        for p in participants
    ]
    return JsonResponse(
        {"success": True, "messages": messages_data, "participants": participants_data}
    )
@login_required
def send_message(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Неверный метод запроса"})
    form = MessageForm(request.POST)
    if not form.is_valid():
        return JsonResponse({"success": False, "error": "Неверные данные формы"})
    chat_id = request.POST.get("chat_id")
    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse(
            {"success": False, "error": "У вас нет доступа к этому чату"}
        )
    message = Messages(
        conversation=chat,
        sender=request.user,
        message_text=form.cleaned_data["message_text"],
        status=MessageStatuses.objects.get(status_name="sent"),
        created_at=timezone.now(),
        updated_at=timezone.now(),
    )
    message.save()
    chat.updated_at = timezone.now()
    chat.save()
    return JsonResponse(
        {
            "success": True,
            "message": {
                "message_id": message.message_id,
                "sender_id": request.user.user_id,
                "sender_name": f"{request.user.first_name} {request.user.last_name}",
                "message_text": message.message_text,
                "created_at": message.created_at.strftime("%d.%m.%Y %H:%M"),
                "created_at_iso": message.created_at.isoformat(),
                "is_read": message.is_read(),
                "is_own": True,
            },
        }
    )
@login_required
def mark_messages_read(request, chat_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Неверный метод запроса"})
    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse(
            {"success": False, "error": "У вас нет доступа к этому чату"}
        )
    read_status = MessageStatuses.objects.get(status_name="read")
    messages = chat.messages_set.filter(status__status_name="sent").exclude(
        sender=request.user
    )
    messages.update(status=read_status, updated_at=timezone.now())
    return JsonResponse({"success": True})
@login_required
def start_chat(request, user_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Неверный метод запроса"})
    target_user = get_object_or_404(Users, user_id=user_id)
    if target_user == request.user:
        return JsonResponse(
            {"success": False, "error": "Нельзя создать чат с самим собой"}
        )
    existing_chat = (
        ChatConversations.objects.annotate(num_participants=Count("chatparticipants"))
        .filter(
            is_group_chat=False, num_participants=2, chatparticipants__user=request.user
        )
        .filter(chatparticipants__user=target_user)
        .first()
    )
    if existing_chat:
        return JsonResponse(
            {"success": True, "chat_id": existing_chat.conversation_id, "existed": True}
        )
    chat = ChatConversations.objects.create(
        name=f"Чат {request.user.first_name} и {target_user.first_name}",
        is_group_chat=False,
        created_at=timezone.now(),
        updated_at=timezone.now(),
    )
    ChatParticipants.objects.create(conversation=chat, user=request.user)
    ChatParticipants.objects.create(conversation=chat, user=target_user)
    chat_data = {
        "conversation_id": chat.conversation_id,
        "name": chat.name,
        "is_group_chat": chat.is_group_chat,
        "participant": {
            "user_id": target_user.user_id,
            "first_name": target_user.first_name,
            "profile_picture_url": target_user.get_profile_picture_url(),
        },
        "last_message": None,
        "unread_count": 0,
    }
    return JsonResponse({"success": True, "chat": chat_data, "existed": False})
@login_required
def add_participant(request, chat_id):
    logger.debug(
        f"Adding participant to chat {chat_id}, user_id: {request.POST.get('user_id')}"
    )
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Неверный метод запроса"}, status=405
        )
    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse(
            {"success": False, "error": "У вас нет доступа к этому чату"}, status=403
        )
    user_id = request.POST.get("user_id")
    if not user_id:
        return JsonResponse(
            {"success": False, "error": "Не указан пользователь"}, status=400
        )
    try:
        new_user = Users.objects.get(user_id=user_id)
    except Users.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return JsonResponse(
            {"success": False, "error": "Пользователь не найден"}, status=404
        )
    if chat.chatparticipants_set.filter(user=new_user).exists():
        return JsonResponse(
            {"success": False, "error": "Пользователь уже в чате"}, status=400
        )
    if not chat.is_group_chat:
        participants = chat.get_participants()
        if participants.count() >= 3:
            return JsonResponse(
                {"success": False, "error": "В личном чате максимум 3 участника"},
                status=400,
            )
        current_roles = {
            p.user.role.role_name.lower()
            for p in participants
            if p.user and p.user.role
        }
        if new_user.role and new_user.role.role_name.lower() in current_roles:
            return JsonResponse(
                {"success": False, "error": "Пользователь с такой ролью уже в чате"},
                status=400,
            )
    ChatParticipants.objects.create(conversation=chat, user=new_user)
    chat.updated_at = timezone.now()
    chat.save()
    logger.info(f"Добавлен участник {new_user.user_id} в чат {chat.conversation_id}")
    return JsonResponse(
        {
            "success": True,
            "new_participant": {
                "user_id": new_user.user_id,
                "name": f"{new_user.first_name} {new_user.last_name}",
                "role": new_user.role.role_name if new_user.role else "Система",
            },
        }
    )
@login_required
def available_users_for_chat(request, chat_id):
    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse(
            {"success": False, "error": "У вас нет доступа к этому чату"}, status=403
        )
    current_participant_ids = chat.chatparticipants_set.values_list(
        "user_id", flat=True
    )
    users = Users.objects.exclude(user_id__in=current_participant_ids).exclude(
        user_id=request.user.user_id
    )
    if chat.is_group_chat:
        users = users.exclude(role__role_name="moderator")
    else:
        current_roles = chat.chatparticipants_set.exclude(
            user=request.user
        ).values_list("user__role__role_name", flat=True)
        users = users.filter(
            role__role_name__in=["startuper", "investor", "moderator"]
        ).exclude(role__role_name__in=current_roles)
    users_data = [
        {
            "user_id": user.user_id,
            "name": f"{user.first_name} {user.last_name}",
            "role": user.role.role_name if user.role else "Неизвестно",
        }
        for user in users
    ]
    return JsonResponse({"success": True, "users": users_data})
@login_required
def leave_chat(request, chat_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Неверный метод запроса"})
    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse(
            {"success": False, "error": "У вас нет доступа к этому чату"}
        )
    ChatParticipants.objects.filter(conversation=chat, user=request.user).delete()
    remaining_participants = chat.chatparticipants_set.all()
    if remaining_participants.exists():
        message = Messages(
            conversation=chat,
            sender=None,
            message_text=f"{request.user.first_name} {request.user.last_name} покинул чат",
            status=MessageStatuses.objects.get(status_name="sent"),
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )
        message.save()
        chat.updated_at = timezone.now()
        chat.save()
    else:
        chat.delete()
        return JsonResponse({"success": True, "deleted": True})
    return JsonResponse({"success": True, "deleted": False})
def planetary_system(request):
    """
    Планетарная система - отображает стартапы как планеты на орбитах
    """
    directions_data = FIXED_CATEGORIES.copy()
    selected_direction_name = request.GET.get("direction", "All")
    logger.info(f"🪐 Планетарная система: выбрано направление '{selected_direction_name}'")
    startups_query = Startups.objects.filter(
        status="approved"
    ).select_related("direction", "owner").order_by("-created_at")
    if selected_direction_name != "All" and selected_direction_name != "Все":
        startups_query = startups_query.filter(
            direction__direction_name=selected_direction_name
        )
    startups_list = list(startups_query)
    print(f"🚀 ПЛАНЕТАРНАЯ СИСТЕМА DEBUG:")
    print(f"🚀 Выбрано направление: '{selected_direction_name}'")
    print(f"🚀 Всего одобренных стартапов в БД: {Startups.objects.filter(status='approved').count()}")
    print(f"🚀 Загружено стартапов после фильтрации: {len(startups_list)}")
    if startups_list:
        for i, startup in enumerate(startups_list[:3]):
            print(f"🚀   {i+1}. {startup.title} - направление: {startup.direction.direction_name if startup.direction else 'Нет'}")
    logger.info(f"🪐 Загружено стартапов: {len(startups_list)}")
    selected_startups = []
    if len(startups_list) >= 6:
        selected_startups = startups_list[:6]
    elif len(startups_list) > 0:
        # Если стартапов меньше 6, показываем только реальные, без заполнения пустыми орбитами
        selected_startups = startups_list
    else:
        # Если стартапов нет вообще, показываем пустой список
        selected_startups = []
    planets_data = []
    for i, startup in enumerate(selected_startups):
        planet_image_num = (i % 15) + 1
        planet_image_url = f"/static/accounts/images/planetary_system/planets_round/{planet_image_num}.png"
        # Найти original_name для категории стартапа
        direction_original = 'Не указано'
        if startup.direction:
            for cat in directions_data:
                if cat['direction_name'] == startup.direction.direction_name or cat['original_name'] == getattr(startup.direction, 'original_name', None):
                    direction_original = cat['original_name']
                    break
        planets_data.append({
            "id": i + 1,
            "startup_id": startup.startup_id,
            "name": startup.title,
            "description": startup.short_description or startup.description[:200] if startup.description else "",
            "image": planet_image_url,
            "rating": startup.get_average_rating(),
            "voters_count": startup.total_voters,
            "comment_count": startup.comments.count(),
            "direction": direction_original,
            "funding_goal": f"{startup.funding_goal:,.0f} ₽".replace(",", " ") if startup.funding_goal else "Не указано",
            "valuation": f"{startup.valuation:,.0f} ₽".replace(",", " ") if startup.valuation else "Не указано",
            "investors": startup.get_investors_count(),
            "progress": startup.get_progress_percentage(),
            "investment_type": "Выкуп+инвестирование" if startup.both_mode else ("Только выкуп" if startup.only_buy else "Только инвестирование")
        })
    all_approved_startups = list(Startups.objects.filter(status="approved").select_related("direction", "owner").order_by("-created_at"))
    all_startups_data = []
    for idx, startup in enumerate(all_approved_startups):
        planet_image_num = (idx % 15) + 1
        planet_image_url = f"/static/accounts/images/planetary_system/planets_round/{planet_image_num}.png"
        direction_original = 'Не указано'
        if startup.direction:
            for cat in directions_data:
                if cat['direction_name'] == startup.direction.direction_name or cat['original_name'] == getattr(startup.direction, 'original_name', None):
                    direction_original = cat['original_name']
                    break
        all_startups_data.append({
            "startup_id": startup.startup_id,
            "name": startup.title,
            "description": startup.short_description or startup.description[:200] if startup.description else "",
            "image": planet_image_url,
            "rating": startup.get_average_rating(),
            "voters_count": startup.total_voters,
            "comment_count": startup.comments.count(),
            "direction": direction_original,
            "funding_goal": f"{startup.funding_goal:,.0f} ₽".replace(",", " ") if startup.funding_goal else "Не указано",
            "valuation": f"{startup.valuation:,.0f} ₽".replace(",", " ") if startup.valuation else "Не указано",
            "investors": startup.get_investors_count(),
            "progress": startup.get_progress_percentage(),
            "investment_type": "Выкуп+инвестирование" if startup.both_mode else ("Только выкуп" if startup.only_buy else "Только инвестирование")
        })
    logo_data = {
        "image": "/static/accounts/images/logo.png"
    }
    print(f"🚀 ПЕРЕДАЕТСЯ В ШАБЛОН:")
    print(f"🚀 Планет для отображения: {len(planets_data)}")
    print(f"🚀 Всех стартапов для фильтрации: {len(all_startups_data)}")
    print(f"🚀 Направлений: {len(directions_data)}")
    print(f"🚀 Выбранная галактика: '{selected_direction_name}'")
    print(f"🚀 Первые 3 планеты: {[p.get('name', 'Нет названия') for p in planets_data[:3]]}")
    print(f"🚀 Переводы направлений: {[(d.get('original_name'), d.get('direction_name')) for d in directions_data[:5]]}")
    context = {
        "planets_data_json": json.dumps(planets_data, ensure_ascii=False),
        "directions_data_json": json.dumps(directions_data, ensure_ascii=False),
        "all_startups_data_json": json.dumps(all_startups_data, ensure_ascii=False),
        "logo_data": logo_data,
        "directions": directions_data,
        "selected_galaxy": selected_direction_name,
    }
    return render(request, "accounts/planetary_system.html", context)
@login_required
def my_startups(request):
    if not hasattr(request.user, "role") or request.user.role.role_name != "startuper":
        messages.error(request, "Доступ к этой странице разрешен только стартаперам.")
        return redirect("profile")
    try:
        user_startups_qs = (
            Startups.objects.filter(owner=request.user)
            .select_related("direction", "stage", "status_id")
            .prefetch_related("comments")
        )
        total_user_startups_count = user_startups_qs.count()
        approved_startups_qs = user_startups_qs.filter(status="approved")
        financial_analytics_data = approved_startups_qs.aggregate(
            total_raised=Sum("amount_raised"),
            max_raised=Max("amount_raised"),
            approved_startups_count=Count("startup_id"),
        )
        approved_startups_count = financial_analytics_data.get(
            "approved_startups_count", 0
        )
        total_amount_raised = financial_analytics_data.get("total_raised") or Decimal(
            "0"
        )
        max_raised = financial_analytics_data.get("max_raised") or Decimal("0")
        
        # Вычисляем минимальное значение только среди стартапов с ненулевыми сборами
        startups_with_funding = approved_startups_qs.filter(amount_raised__gt=0)
        min_raised_data = startups_with_funding.aggregate(
            min_raised=Min("amount_raised")
        )
        min_raised = min_raised_data.get("min_raised") or Decimal("0")
        category_data_raw = (
            user_startups_qs.values("direction__direction_name")
            .annotate(category_count=Count("startup_id"))
            .order_by("-category_count")
        )
        investment_categories = []
        invested_category_data_dict = {}
        total_for_category_percentage = (
            total_user_startups_count if total_user_startups_count > 0 else 1
        )
        for cat_data in category_data_raw:
            percentage = 0
            category_count = cat_data.get("category_count")
            category_name = cat_data.get("direction__direction_name") or "Без категории"
            if category_count and total_for_category_percentage > 0:
                try:
                    percentage = round(
                        (int(category_count) / total_for_category_percentage) * 100
                    )
                    percentage = min(percentage, 100)
                except Exception as e:
                    logger.error(
                        f"Ошибка расчета процента (по количеству) для категории '{category_name}': {e}"
                    )
                    percentage = 0
            investment_categories.append(
                {
                    "name": category_name,
                    "percentage": percentage,
                }
            )
            invested_category_data_dict[category_name] = percentage
        current_year = timezone.now().year
        logger.info(
            f"[my_startups] Preparing chart data for user {request.user.email}, year: {current_year}"
        )
        monthly_data_direct = (
            approved_startups_qs.filter(
                updated_at__year=current_year, amount_raised__gt=0
            )
            .annotate(month=TruncMonth("updated_at"))
            .values("month")
            .annotate(monthly_total=Sum(Coalesce("amount_raised", Decimal(0))))
            .order_by("month")
        )
        month_labels = [
            "Янв",
            "Фев",
            "Мар",
            "Апр",
            "Май",
            "Июн",
            "Июл",
            "Авг",
            "Сен",
            "Окт",
            "Ноя",
            "Дек",
        ]
        monthly_totals = [0] * 12
        for data in monthly_data_direct:
            month_index = data["month"].month - 1
            if 0 <= month_index < 12:
                monthly_total_decimal = data.get(
                    "monthly_total", Decimal(0)
                ) or Decimal(0)
                monthly_totals[month_index] = float(monthly_total_decimal)
        logger.info(
            f"[my_startups] Preparing chart data for user {request.user.email}, year: {current_year}"
        )
        monthly_category_data_raw = (
            approved_startups_qs.filter(
                updated_at__year=current_year,
                amount_raised__gt=0,
                direction__isnull=False,
            )
            .annotate(month=TruncMonth("updated_at"))
            .values("month", "direction__direction_name")
            .annotate(monthly_category_total=Sum(Coalesce("amount_raised", Decimal(0))))
            .order_by("month", "direction__direction_name")
        )
        logger.info(
            f"[my_startups] Raw monthly category data from DB: {list(monthly_category_data_raw)}"
        )
        structured_monthly_data = collections.defaultdict(
            lambda: collections.defaultdict(float)
        )
        unique_categories = set()
        for data in monthly_category_data_raw:
            month_dt = data["month"]
            category_name = data["direction__direction_name"]
            amount = float(data.get("monthly_category_total", 0) or 0)
            month_key = month_dt.strftime("%Y-%m-01")
            structured_monthly_data[month_key][category_name] += amount
            unique_categories.add(category_name)
        sorted_categories = sorted(list(unique_categories))
        logger.info(
            f"[my_startups] Unique categories found for chart: {sorted_categories}"
        )
        chart_data_list = []
        start_date = datetime.date(current_year, 1, 1)
        for i in range(12):
            current_month_key = (start_date + relativedelta(months=i)).strftime(
                "%Y-%m-01"
            )
            month_data = {
                "month_key": current_month_key,
                "category_data": dict(structured_monthly_data[current_month_key]),
            }
            chart_data_list.append(month_data)
        logger.info(
            f"[my_startups] Final structured chart data list: {chart_data_list}"
        )
        try:
            all_directions_qs = Directions.objects.all().order_by("direction_name")
            all_directions_list = [
                {"direction_name": d.direction_name} for d in all_directions_qs
            ]
        except Exception as e:
            logger.error(f"Ошибка при получении всех направлений: {str(e)}")
            all_directions_list = []
        try:
            approved_startups_annotated = (
                approved_startups_qs.annotate(
                    average_rating=Avg(
                        models.ExpressionWrapper(
                            Coalesce(models.F("sum_votes"), 0)
                            * 1.0
                            / Coalesce(models.F("total_voters"), 1),
                            output_field=FloatField(),
                        ),
                        filter=models.Q(total_voters__gt=0),
                        default=0.0,
                    ),
                    comment_count=Count("comments"),
                )
                .annotate(average_rating=Coalesce("average_rating", 0.0))
                .order_by("-created_at")
            )
        except Exception as e:
            logger.error(f"Ошибка при получении одобренных стартапов: {str(e)}")
            approved_startups_annotated = []
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            region_name=settings.AWS_S3_REGION_NAME,
        )
        planetary_startups = []
        print(f"🚀 DEBUG: approved_startups_annotated count: {len(approved_startups_annotated)}")
        for idx, startup in enumerate(approved_startups_annotated, start=1):
            orbit_size = (idx * 100) + 150
            orbit_time = (idx * 10) + 40
            planet_size = 60
            planet_data = {
                "startup_id": startup.startup_id,
                "title": startup.title or "Без названия",
                "planet_image": startup.planet_image,
                "logo_urls": startup.logo_urls,
                "average_rating": startup.average_rating or 0,
                "rating": startup.average_rating or 0,  # новое поле для фронта
                "total_voters": startup.total_voters or 0,
                "comment_count": startup.comment_count or 0,
                "description": startup.description or "Описание отсутствует.",
                "short_description": startup.description or "Описание отсутствует.",
                "progress": startup.get_progress_percentage() or 0,
                "funding_goal": startup.funding_goal or 0,
                "amount_raised": startup.amount_raised or 0,
                "get_investors_count": startup.get_investors_count(),
                "direction": startup.direction.direction_name if startup.direction else "Не указано",
                "investment_type": "Не указано",
                "orbit_size": orbit_size,
                "orbit_time": orbit_time,
                "planet_size": planet_size,
            }
            planetary_startups.append(planet_data)
            print(f"🚀 DEBUG: Added planet data for startup {startup.startup_id}: {startup.title}")
        print(f"🚀 DEBUG: Total planetary_startups: {len(planetary_startups)}")
    except Exception as e:
        logger.error(f"Критическая ошибка в my_startups view: {e}", exc_info=True)
        messages.error(
            request, "Произошла ошибка при загрузке страницы ваших стартапов."
        )
        return redirect("profile")
    context = {
        "user_startups": approved_startups_annotated,
        "planetary_startups": planetary_startups,
        "total_investment": total_amount_raised,
        "startups_count": approved_startups_count,
        "max_investment": max_raised,
        "min_investment": min_raised,
        "investment_categories": investment_categories[
            :7
        ],
        "invested_category_data": invested_category_data_dict,
        "all_directions": all_directions_list,
        "month_labels": month_labels,
        "chart_monthly_category_data": chart_data_list,
        "chart_categories": sorted_categories,
        "startup_applications": user_startups_qs.order_by("-updated_at"),
    }
    context["planetary_startups_json"] = json.dumps(
        planetary_startups, cls=DjangoJSONEncoder, ensure_ascii=False
    )
    print(f"🚀 DEBUG: planetary_startups_json length: {len(context['planetary_startups_json'])}")
    print(f"🚀 DEBUG: First few characters of JSON: {context['planetary_startups_json'][:200]}...")
    return render(request, "accounts/my_startups.html", context)
@login_required
def notifications_view(request):
    return render(request, "accounts/notifications.html")
@login_required
def create_group_chat(request):
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Метод не разрешен."}, status=405
        )
    try:
        data = json.loads(request.body)
        chat_name = data.get("name", "").strip()
        user_ids = data.get("user_ids", [])
        if not chat_name:
            return JsonResponse(
                {"success": False, "error": "Название чата не может быть пустым."},
                status=400,
            )
        if not user_ids:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Необходимо выбрать хотя бы одного участника.",
                },
                status=400,
            )
        try:
            participant_ids = list(set(int(uid) for uid in user_ids))
        except (ValueError, TypeError):
            return JsonResponse(
                {"success": False, "error": "Неверный формат ID пользователей."},
                status=400,
            )
        if request.user.user_id in participant_ids:
            participant_ids.remove(request.user.user_id)
        if not participant_ids:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Нельзя создать групповой чат только с самим собой.",
                },
                status=400,
            )
        if Users.objects.filter(
            user_id__in=participant_ids, role__role_name="moderator"
        ).exists():
            return JsonResponse(
                {
                    "success": False,
                    "error": "Модераторы не могут быть добавлены в групповой чат.",
                },
                status=400,
            )
        with transaction.atomic():
            conversation = ChatConversations.objects.create(
                name=chat_name,
                is_group_chat=True,
                created_at=timezone.now(),
                updated_at=timezone.now(),
            )
            all_participant_users = [request.user]
            users_to_add = Users.objects.filter(user_id__in=participant_ids)
            all_participant_users.extend(list(users_to_add))
            if len(all_participant_users) != len(participant_ids) + 1:
                logger.error(
                    f"Не все пользователи найдены для создания чата. Передано ID: {participant_ids}"
                )
                raise Exception("Один или несколько пользователей не найдены.")
            participants_to_create = [
                ChatParticipants(conversation=conversation, user=user)
                for user in all_participant_users
            ]
            ChatParticipants.objects.bulk_create(participants_to_create)
        chat_data = {
            "conversation_id": conversation.conversation_id,
            "name": conversation.name,
            "is_group_chat": conversation.is_group_chat,
            "participant": None,
            "last_message": None,
            "unread_count": 0,
        }
        logger.info(
            f"Групповой чат создан: ID={conversation.conversation_id}, Название={chat_name}, Участников={len(all_participant_users)}"
        )
        return JsonResponse({"success": True, "chat": chat_data})
    except json.JSONDecodeError:
        logger.error("Неверный формат JSON в create_group_chat")
        return JsonResponse(
            {"success": False, "error": "Неверный формат данных (JSON)."}, status=400
        )
    except Exception as e:
        logger.error(f"Ошибка при создании группового чата: {str(e)}", exc_info=True)
        return JsonResponse(
            {"success": False, "error": "Внутренняя ошибка сервера."}, status=500
        )
@login_required
def support_page_view(request):
    is_moderator = (
        request.user.is_authenticated
        and request.user.role
        and request.user.role.role_name == "moderator"
    )
    context = {"is_moderator": is_moderator}
    return render(request, "accounts/support.html", context)
@login_required
def change_owner(request, startup_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Неверный метод запроса"})
    if not request.user.role or request.user.role.role_name != "moderator":
        return JsonResponse(
            {"success": False, "error": "У вас нет прав для этого действия"}
        )
    startup = get_object_or_404(Startups, startup_id=startup_id)
    new_owner_id = request.POST.get("new_owner_id")
    new_owner = get_object_or_404(Users, user_id=new_owner_id)
    startup.owner = new_owner
    startup.save()
    return JsonResponse({"success": True})
@login_required
def get_investors(request, startup_id):
    if not request.user.is_authenticated or request.user.role.role_name != "moderator":
        return JsonResponse({"error": "Доступ запрещен"}, status=403)
    startup = get_object_or_404(Startups, startup_id=startup_id)
    investors = InvestmentTransactions.objects.filter(startup=startup).select_related(
        "investor"
    )
    investor_list = []
    for tx in investors:
        if tx.investor:
            investor_list.append(
                {
                    "user_id": tx.investor.user_id,
                    "name": tx.investor.get_full_name() or tx.investor.email,
                    "amount": float(tx.amount),
                }
            )
    html = render_to_string(
        "accounts/partials/_investors_list.html",
        {"investors": investor_list, "startup": startup, "user": request.user},
    )
    return JsonResponse({"html": html})
@login_required
def add_investor(request, startup_id):
    if not request.user.is_authenticated or request.user.role.role_name != "moderator":
        return JsonResponse({"error": "Доступ запрещен"}, status=403)
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            amount = Decimal(data.get("amount"))
            startup = get_object_or_404(Startups, startup_id=startup_id)
            user_to_invest = get_object_or_404(Users, user_id=user_id)
            if amount <= 0:
                return JsonResponse(
                    {"success": False, "error": "Сумма должна быть положительной."}
                )
            existing_tx = InvestmentTransactions.objects.filter(
                startup_id=startup_id, investor=user_to_invest
            ).first()
            if existing_tx:
                existing_tx.amount = amount
                existing_tx.save()
            else:
                try:
                    investment_type_obj = TransactionTypes.objects.get(
                        type_name="investment"
                    )
                    InvestmentTransactions.objects.create(
                        investor=user_to_invest,
                        startup=startup,
                        amount=amount,
                        transaction_type=investment_type_obj,
                    )
                except TransactionTypes.DoesNotExist:
                    return JsonResponse(
                        {"error": "Тип транзакции 'investment' не найден в системе."},
                        status=500,
                    )
            startup.amount_raised = startup.investmenttransactions_set.aggregate(
                total=Sum("amount")
            )["total"] or Decimal("0")
            startup.save(update_fields=["amount_raised"])
            new_investor_count = startup.get_investors_count()
            return JsonResponse(
                {
                    "success": True,
                    "new_amount_raised": float(startup.amount_raised),
                    "new_investor_count": new_investor_count,
                }
            )
        except (json.JSONDecodeError, TypeError, ValueError) as e:
            return JsonResponse(
                {"error": f"Неверный формат данных: {str(e)}"}, status=400
            )
    return JsonResponse({"error": "Метод не поддерживается"}, status=405)
@login_required
def edit_investment(request, startup_id, user_id):
    if request.method != "POST":
        return JsonResponse({"success": False, "error": "Неверный метод запроса"})
    if not request.user.role or request.user.role.role_name != "moderator":
        return JsonResponse(
            {"success": False, "error": "У вас нет прав для этого действия"}
        )
    startup = get_object_or_404(Startups, startup_id=startup_id)
    investor = get_object_or_404(Users, user_id=user_id)
    new_amount = Decimal(request.POST.get("amount", "0"))
    if new_amount <= 0:
        return JsonResponse({"success": False, "error": "Сумма должна быть больше 0"})
    transaction = get_object_or_404(
        InvestmentTransactions,
        startup=startup,
        investor=investor,
        transaction_status="completed",
    )
    old_amount = transaction.amount
    transaction.amount = new_amount
    transaction.updated_at = timezone.now()
    transaction.save()
    startup.amount_raised = (
        (startup.amount_raised or Decimal("0")) - old_amount + new_amount
    )
    startup.save()
    return JsonResponse({"success": True})
@login_required
def delete_investment(request, startup_id, user_id):
    if not request.user.is_authenticated or request.user.role.role_name != "moderator":
        return JsonResponse({"error": "Доступ запрещен"}, status=403)
    if request.method == "POST":
        with transaction.atomic():
            try:
                user_to_delete = get_object_or_404(Users, pk=user_id)
                tx = get_object_or_404(
                    InvestmentTransactions,
                    startup_id=startup_id,
                    investor=user_to_delete,
                )
                startup = tx.startup
                tx.delete()
                new_total = startup.investmenttransactions_set.aggregate(
                    total=Sum("amount")
                )["total"] or Decimal("0")
                startup.amount_raised = new_total
                startup.save(update_fields=["amount_raised"])
                new_investor_count = startup.get_investors_count()
                return JsonResponse(
                    {
                        "success": True,
                        "new_amount_raised": float(startup.amount_raised),
                        "new_investor_count": new_investor_count,
                    }
                )
            except InvestmentTransactions.DoesNotExist:
                return JsonResponse({"error": "Инвестиция не найдена"}, status=404)
            except Exception as e:
                logger.error(f"Ошибка при удалении инвестиции: {e}")
                return JsonResponse({"error": "Внутренняя ошибка сервера"}, status=500)
    return JsonResponse({"error": "Неверный метод запроса"}, status=405)
@login_required
def support_orders_view(request):
    if (
        request.user.is_authenticated
        and request.user.role
        and request.user.role.role_name == "moderator"
    ):
        orders = SupportTicket.objects.all().order_by("-created_at")
        is_moderator = True
    else:
        orders = SupportTicket.objects.filter(user=request.user).order_by("-created_at")
        is_moderator = False
    context = {"orders": orders, "is_moderator": is_moderator}
    return render(request, "accounts/support_orders.html", context)
@login_required
def support_ticket_detail(request, ticket_id):
    ticket = get_object_or_404(SupportTicket, pk=ticket_id)
    user = request.user
    is_moderator = (
        user.is_authenticated and user.role and user.role.role_name == "moderator"
    )
    if not (user == ticket.user or is_moderator):
        return HttpResponseForbidden("У вас нет доступа к этой заявке.")
    form = None
    if is_moderator:
        if request.method == "POST":
            form = ModeratorTicketForm(request.POST, instance=ticket)
            if form.is_valid():
                form.save()
                messages.success(request, "Заявка успешно обновлена.")
                return redirect("support_ticket_detail", ticket_id=ticket.ticket_id)
        else:
            form = ModeratorTicketForm(instance=ticket)
    context = {
        "ticket": ticket,
        "form": form,
        "is_moderator": is_moderator,
    }
    return render(request, "accounts/support_ticket_detail.html", context)
@login_required
def support_contact_view(request):
    if request.method == "POST":
        form = SupportTicketForm(request.POST)
        if form.is_valid():
            ticket = form.save(commit=False)
            ticket.user = request.user
            ticket.save()
            send_telegram_support_message(ticket)
            messages.success(
                request, "Ваше обращение успешно отправлено! Мы скоро с вами свяжемся."
            )
            return redirect("support_contact")
    else:
        form = SupportTicketForm()
    context = {"form": form}
    return render(request, "accounts/support_contact.html", context)
@login_required
def rename_chat(request, chat_id):
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Неверный метод запроса"}, status=405
        )
    chat = get_object_or_404(ChatConversations, conversation_id=chat_id)
    if not chat.chatparticipants_set.filter(user=request.user).exists():
        return JsonResponse(
            {"success": False, "error": "У вас нет доступа к этому чату"}, status=403
        )
    try:
        data = json.loads(request.body)
        new_name = data.get("name", "").strip()
        if not new_name:
            return JsonResponse(
                {"success": False, "error": "Название не может быть пустым"}, status=400
            )
        with transaction.atomic():
            chat.name = new_name
            chat.updated_at = timezone.now()
            chat.save()
        logger.info(f"Чат {chat.conversation_id} переименован в {new_name}")
        return JsonResponse({"success": True, "chat_name": new_name})
    except json.JSONDecodeError:
        logger.error("Неверный формат JSON в rename_chat")
        return JsonResponse(
            {"success": False, "error": "Неверный формат данных"}, status=400
        )
    except Exception as e:
        logger.error(f"Ошибка при переименовании чата {chat_id}: {str(e)}")
        return JsonResponse(
            {"success": False, "error": f"Ошибка: {str(e)}"}, status=500
        )
@login_required
def available_users(request):
    users = Users.objects.exclude(user_id=request.user.user_id).exclude(
        role__role_name="moderator"
    )
    users_data = [
        {
            "user_id": user.user_id,
            "name": f"{user.first_name} {user.last_name}",
            "role": user.role.role_name if user.role else "unknown",
            "profile_picture_url": user.get_profile_picture_url() or "",
        }
        for user in users
    ]
    return JsonResponse({"success": True, "users": users_data})
@login_required
def find_or_create_chat(request, recipient_id):
    if request.method == "POST":
        recipient = get_object_or_404(Users, user_id=recipient_id)
        if request.user.user_id == recipient.user_id:
            return JsonResponse(
                {"error": "You cannot start a chat with yourself."}, status=400
            )
        user_chats = ChatConversations.objects.filter(
            is_group_chat=False, chatparticipants__user=request.user
        ).annotate(num_participants=Count("chatparticipants"))
        personal_chats = user_chats.filter(num_participants=2)
        chat = personal_chats.filter(chatparticipants__user=recipient).first()
        if not chat:
            chat = ChatConversations.objects.create(
                is_group_chat=False,
                created_at=timezone.now(),
                updated_at=timezone.now(),
            )
            ChatParticipants.objects.create(conversation=chat, user=request.user)
            ChatParticipants.objects.create(conversation=chat, user=recipient)
        chat_url = reverse("cosmochat") + f"?chat_id={chat.conversation_id}"
        return JsonResponse({"chat_url": chat_url})
    return JsonResponse({"error": "Invalid request method."}, status=405)
def get_user_rating_for_startup(user_id, startup_id):
    """
    // ... existing code ...
    """
    pass
def custom_404(request, exception):
    return render(request, "accounts/404.html", status=404)
@csrf_exempt
@require_POST
def telegram_webhook(request, token):
    bot_token = "7843250850:AAEL8hapR_WVcG2mMNUhWvK-I0DMYG042Ko"
    if token != bot_token:
        logger.warning("Invalid token in webhook URL.")
        return HttpResponseForbidden("Invalid token")
    try:
        data = json.loads(request.body)
        logger.info(f"Webhook received data: {data}")
        if "callback_query" not in data:
            return HttpResponse(status=200)
        callback_query = data["callback_query"]
        callback_data = callback_query["data"]
        message = callback_query["message"]
        chat_id = message["chat"]["id"]
        message_id = message["message_id"]
        requests.post(
            f"https://api.telegram.org/bot{bot_token}/answerCallbackQuery",
            json={"callback_query_id": callback_query["id"]},
        )
        new_text = message.get("text", "")
        new_keyboard = None
        ticket = None
        if callback_data.startswith("close_ticket_"):
            ticket_id = int(callback_data.split("_")[2])
            ticket = SupportTicket.objects.filter(pk=ticket_id).first()
            if ticket:
                ticket.status = "closed"
                ticket.save(update_fields=["status"])
                status_line = "\n\n<b>✅ ЗАЯВКА ЗАКРЫТА</b>"
                if status_line not in new_text:
                    new_text += status_line
                new_keyboard = {
                    "inline_keyboard": [
                        [
                            {
                                "text": "↩️ Вернуть в работу",
                                "callback_data": f"reopen_ticket_{ticket.ticket_id}",
                            }
                        ]
                    ]
                }
                logger.info(f"Ticket {ticket_id} was closed via Telegram.")
        elif callback_data.startswith("reopen_ticket_"):
            ticket_id = int(callback_data.split("_")[2])
            ticket = SupportTicket.objects.filter(pk=ticket_id).first()
            if ticket:
                ticket.status = "new"
                ticket.save(update_fields=["status"])
                status_line = "\n\n<b>✅ ЗАЯВКА ЗАКРЫТА</b>"
                if new_text.endswith(status_line):
                    new_text = new_text[: -len(status_line)]
                new_keyboard = {
                    "inline_keyboard": [
                        [
                            {
                                "text": "✅ Исполнено",
                                "callback_data": f"close_ticket_{ticket.ticket_id}",
                            }
                        ]
                    ]
                }
                logger.info(f"Ticket {ticket_id} was reopened via Telegram.")
        if new_keyboard:
            payload = {
                "chat_id": chat_id,
                "message_id": message_id,
                "text": new_text,
                "parse_mode": "HTML",
                "reply_markup": new_keyboard,
            }
            requests.post(
                f"https://api.telegram.org/bot{bot_token}/editMessageText", json=payload
            )
        return HttpResponse(status=200)
    except json.JSONDecodeError:
        logger.error("Error decoding JSON from Telegram webhook.")
        return HttpResponse(status=400)
    except Exception as e:
        logger.error(f"Error processing Telegram webhook: {e}", exc_info=True)
        return HttpResponse(status=500)
