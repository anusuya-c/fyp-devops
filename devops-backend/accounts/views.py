from django.shortcuts import render
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.urls import reverse
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

# Create your views here.

class CustomPasswordResetView(auth_views.PasswordResetView):
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['frontend_url'] = settings.FRONTEND_URL
        return context

    def form_valid(self, form):
        opts = {
            'use_https': self.request.is_secure(),
            'token_generator': self.token_generator,
            'from_email': self.from_email,
            'email_template_name': self.email_template_name,
            'subject_template_name': self.subject_template_name,
            'request': self.request,
            'html_email_template_name': self.html_email_template_name,
            'extra_email_context': {
                'frontend_domain': settings.FRONTEND_DOMAIN,
                'site_name': settings.SITE_NAME,
            }
        }
        form.save(**opts)
        return super().form_valid(form)

    def get_reset_url(self, user):
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        return f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

    def send_mail(self, subject_template_name, email_template_name,
                  context, from_email, to_email, html_email_template_name=None):
        context['reset_url'] = self.get_reset_url(context['user'])
        super().send_mail(subject_template_name, email_template_name,
                         context, from_email, to_email, html_email_template_name)

    def get_success_url(self):
        return settings.FRONTEND_URL + '/password-reset-done/'
