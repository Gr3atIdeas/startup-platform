from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('startups/', views.startups_list, name='startups_list'),
    path('startups/<int:startup_id>/', views.startup_detail, name='startup_detail'),
    path('investments/', views.investments, name='investments'),
    path('news/', views.news, name='news'),
    path('legal/', views.legal, name='legal'),
    path('create_startup/', views.create_startup, name='create_startup'),
    path('moderator/', views.moderator_dashboard, name='moderator_dashboard'),
    path('moderator/approve/<int:startup_id>/', views.approve_startup, name='approve_startup'),
    path('moderator/reject/<int:startup_id>/', views.reject_startup, name='reject_startup'),
    path('vote/<int:startup_id>/', views.vote_startup, name='vote_startup'),
    path('startup/<int:startup_id>/edit/', views.edit_startup, name='edit_startup'),
    path('invest/<int:startup_id>/', views.invest, name='invest'),  # Добавлен маршрут для инвестиций
]