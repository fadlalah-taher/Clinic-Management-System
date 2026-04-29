from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Doctor, Medication, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ('role', 'doctor', 'patient_mongo_id')
    extra = 0


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'get_role', 'is_staff')

    def get_role(self, obj):
        try:
            return obj.profile.role
        except Exception:
            return 'admin'
    get_role.short_description = 'Role'


# Re-register User with the extended admin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'doctor', 'patient_mongo_id')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('name', 'specialty', 'email', 'phone', 'created_at')
    search_fields = ('name', 'email', 'specialty')
    list_filter = ('specialty',)


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ('name', 'dosage', 'created_at')
    search_fields = ('name', 'dosage')


# Patient and Appointment are stored in MongoDB; no Django admin for them.
