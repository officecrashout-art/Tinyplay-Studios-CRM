-- Migration 003: Automated Audit Triggers for Activity Logging

CREATE OR REPLACE FUNCTION public.audit_lead_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_actor_staff_id TEXT := 'SYSTEM';
    v_actor_name TEXT := 'System Automation';
    v_desc TEXT;
    v_action TEXT;
BEGIN
    v_actor_id := auth.uid();
    IF v_actor_id IS NOT NULL THEN
        SELECT staff_id, full_name INTO v_actor_staff_id, v_actor_name 
        FROM public.staff_profiles 
        WHERE id = v_actor_id;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        v_action := 'CREATE';
        v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' added new lead for ' || NEW.customer_name || ' (' || NEW.platform || ' @' || NEW.handle || ')';
        
        INSERT INTO public.activity_logs (
            actor_id, actor_staff_id, actor_name, 
            entity_type, entity_id, action, 
            description, new_values
        ) VALUES (
            v_actor_id, v_actor_staff_id, v_actor_name,
            'lead', NEW.id, v_action,
            v_desc, to_jsonb(NEW)
        );
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        -- Status change
        IF (OLD.status IS DISTINCT FROM NEW.status) THEN
            v_action := 'STATUS_CHANGE';
            v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' changed customer status from ' || OLD.status || ' to ' || NEW.status;
        -- Conversion to customer
        ELSIF (OLD.is_converted IS FALSE AND NEW.is_converted IS TRUE) THEN
            v_action := 'CONVERT';
            v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' converted lead ' || NEW.customer_name || ' into a confirmed customer';
        -- Reassignment
        ELSIF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
            v_action := 'REASSIGN';
            DECLARE
                v_new_assignee_name TEXT := 'unassigned';
            BEGIN
                IF NEW.assigned_to IS NOT NULL THEN
                    SELECT coalesce(staff_id || ' (' || full_name || ')', full_name) 
                    INTO v_new_assignee_name 
                    FROM public.staff_profiles 
                    WHERE id = NEW.assigned_to;
                END IF;
                v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' reassigned lead ' || NEW.customer_name || ' to ' || v_new_assignee_name;
            END;
        ELSE
            v_action := 'UPDATE';
            v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' updated lead details for ' || NEW.customer_name;
        END IF;

        INSERT INTO public.activity_logs (
            actor_id, actor_staff_id, actor_name, 
            entity_type, entity_id, action, 
            description, old_values, new_values
        ) VALUES (
            v_actor_id, v_actor_staff_id, v_actor_name,
            'lead', NEW.id, v_action,
            v_desc, to_jsonb(OLD), to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_audit_lead
AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.audit_lead_changes();

-- Trigger for Projects
CREATE OR REPLACE FUNCTION public.audit_project_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_actor_staff_id TEXT := 'SYSTEM';
    v_actor_name TEXT := 'System Automation';
    v_desc TEXT;
    v_action TEXT;
BEGIN
    v_actor_id := auth.uid();
    IF v_actor_id IS NOT NULL THEN
        SELECT staff_id, full_name INTO v_actor_staff_id, v_actor_name 
        FROM public.staff_profiles 
        WHERE id = v_actor_id;
    END IF;

    IF (TG_OP = 'INSERT') THEN
        v_action := 'CREATE';
        v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' created project "' || NEW.title || '" with agreed price ৳' || NEW.agreed_price_bdt;
        
        INSERT INTO public.activity_logs (
            actor_id, actor_staff_id, actor_name, 
            entity_type, entity_id, action, 
            description, new_values
        ) VALUES (
            v_actor_id, v_actor_staff_id, v_actor_name,
            'project', NEW.id, v_action,
            v_desc, to_jsonb(NEW)
        );
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.stage IS DISTINCT FROM NEW.stage) THEN
            v_action := 'STATUS_CHANGE';
            v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' moved project "' || NEW.title || '" stage to ' || NEW.stage;
        ELSIF (OLD.assigned_developer IS DISTINCT FROM NEW.assigned_developer) THEN
            v_action := 'UPDATE';
            v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' assigned developer ' || coalesce(NEW.assigned_developer, 'None') || ' to project "' || NEW.title || '"';
        ELSE
            v_action := 'UPDATE';
            v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' updated project "' || NEW.title || '"';
        END IF;

        INSERT INTO public.activity_logs (
            actor_id, actor_staff_id, actor_name, 
            entity_type, entity_id, action, 
            description, old_values, new_values
        ) VALUES (
            v_actor_id, v_actor_staff_id, v_actor_name,
            'project', NEW.id, v_action,
            v_desc, to_jsonb(OLD), to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_audit_project
AFTER INSERT OR UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.audit_project_changes();

-- Trigger for Payments
CREATE OR REPLACE FUNCTION public.audit_payment_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_actor_staff_id TEXT := 'SYSTEM';
    v_actor_name TEXT := 'System Automation';
    v_project_title TEXT := 'Project';
    v_desc TEXT;
BEGIN
    v_actor_id := auth.uid();
    IF v_actor_id IS NOT NULL THEN
        SELECT staff_id, full_name INTO v_actor_staff_id, v_actor_name 
        FROM public.staff_profiles 
        WHERE id = v_actor_id;
    END IF;

    SELECT title INTO v_project_title FROM public.projects WHERE id = NEW.project_id;

    IF (TG_OP = 'INSERT') THEN
        v_desc := coalesce(v_actor_staff_id, 'STAFF') || ' recorded ' || NEW.payment_type || ' payment of ৳' || NEW.amount_bdt || ' via ' || NEW.payment_method || ' for "' || coalesce(v_project_title, 'Project') || '"';
        
        INSERT INTO public.activity_logs (
            actor_id, actor_staff_id, actor_name, 
            entity_type, entity_id, action, 
            description, new_values
        ) VALUES (
            v_actor_id, v_actor_staff_id, v_actor_name,
            'payment', NEW.id, 'PAYMENT_RECORDED',
            v_desc, to_jsonb(NEW)
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_audit_payment
AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.audit_payment_changes();
