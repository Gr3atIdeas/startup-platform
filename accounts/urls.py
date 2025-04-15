# accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('startups/', views.startups_list, name='startups_list'),
    path('startups/<int:startup_id>/', views.startup_detail, name='startup_detail'),
    path('investments/', views.investments, name='investments'),
    path('news/', views.news, name='news'),
    path('legal/', views.legal, name='legal'),
    path('profile/', views.profile, name='profile'),
    path('create-startup/', views.create_startup, name='create_startup'),
    path('edit-startup/<int:startup_id>/', views.edit_startup, name='edit_startup'),
    path('moderator-dashboard/', views.moderator_dashboard, name='moderator_dashboard'),
    path('approve-startup/<int:startup_id>/', views.approve_startup, name='approve_startup'),
    path('reject-startup/<int:startup_id>/', views.reject_startup, name='reject_startup'),
    path('vote-startup/<int:startup_id>/', views.vote_startup, name='vote_startup'),
    path('invest/<int:startup_id>/', views.invest, name='invest'),
    path('search-suggestions/', views.search_suggestions, name='search_suggestions'),  # Новый маршрут
]