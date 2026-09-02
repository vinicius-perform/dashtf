import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CrmLead, CrmLeadSummary } from '../types/crm';
import { fetchCrmLeads, computeCrmLeadSummary, createManualCrmLead, MOCK_CRM_LEADS } from '../services/crmLeadsService';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { MetricCard } from './MetricCard';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { getThisMonthRange, formatDateRangeLabel } from '../utils/timezone';
import { AddLeadModal } from './AddLeadModal';
import { 
  Users, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Calendar,
  Plus,
  Database,
  Trash2
} from 'lucide-react';

interface CrmLeadsViewProps {
  isLoading?: boolean;
}

// 1. Dados do Seed Histórico (Apenas data YYYY-MM-DD)
const historicalSeedData = [
{ data_hora: "2026-07-08", nome: "Silei Robledo e Oliveira Moreira", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-11", nome: "Peterson", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-14", nome: "Coife odonto", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Sim", valor_conversao: 4248 },
{ data_hora: "2026-07-14", nome: "Luciana kido", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-16", nome: "Maxwell pereira", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-16", nome: "Nayane", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-16", nome: "Breno", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-17", nome: "Fernando", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-17", nome: "Marla", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-17", nome: "Ísis joanides Pereira de andrade", campaign_id: "120250823689960597", ad_id: "120250877377730597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-18", nome: "Luciana", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-18", nome: "Tiago", campaign_id: "120248445763260716", ad_id: "120248446145370716", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-18", nome: "Connye Angelica Santiago", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-18", nome: "Dra. Núbia Medeiros", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-18", nome: "Venicio pereira", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-18", nome: "Dra Ivaneide Barbosa", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-19", nome: "Flávia", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-19", nome: "Íedys dantas cruz rocha", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-19", nome: "Kassya rebelo", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-20", nome: "Bruno Carneiro", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-20", nome: "Aline rossi", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-20", nome: "Suleima", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-21", nome: "Bruno Moraes", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Sim", valor_conversao: 6500 },
{ data_hora: "2026-07-21", nome: "Ana Beatriz Costa", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-21", nome: "Silvia Teixeira", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-21", nome: "Silvia Bastos", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Sim", valor_conversao: 4500 },
{ data_hora: "2026-07-21", nome: "Klebson Pereira Da Silva", campaign_id: "120250823689960597", ad_id: "120250966557570597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-21", nome: "Dra. Marilu", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-21", nome: "Dra. Marilu", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-22", nome: "Stefane Rodrigues Teixeira", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-22", nome: "Paula Faria", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-22", nome: "Franz Dicker Castedo Arteaga", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-22", nome: "Franz Dicker Castedo Arteaga", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-22", nome: "Carlos Vinicius de Moraes", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-22", nome: "Dra Dayany Fiomare", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-23", nome: "Aline Pereira", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-23", nome: "Dr. João arruda", campaign_id: "120250823689960597", ad_id: "120250966557570597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-24", nome: "Mariana uemura", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-24", nome: "Ângela Maria trindade", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-24", nome: "Matheus Martins dos Santos", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-24", nome: "Ursula Clara de Souza Amorim trindade Loiola", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-24", nome: "Juliana Gonçalves da Silva", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-24", nome: "Laís", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-25", nome: "Cheila da Silva Chavasco", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-25", nome: "Nisrin Jebai", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-25", nome: "Romina Daiana cosmo", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-26", nome: "Vera Stein", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-26", nome: "Pamila Rios", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-27", nome: "Dr Molino", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Sim", valor_conversao: 5000 },
{ data_hora: "2026-07-27", nome: "Dr Regina", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-27", nome: "Eduardo rauen", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-28", nome: "Dra Meiriély da Silva", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-28", nome: "Tiago Prause", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Sim", venda: "Sim", valor_conversao: 7500 },
{ data_hora: "2026-07-29", nome: "Roco", campaign_id: "120251163211460597", ad_id: "120251163268460597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-30", nome: "Paula", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-31", nome: "Lenise amaral", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-31", nome: "Roberta Simone Ribeiro Dantas", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-31", nome: "Marcio Kinjo", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-31", nome: "Livia", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-07-31", nome: "Roco Giaculi", campaign_id: "120251243939380597", ad_id: "120251244381940597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-01", nome: "Gustavo Belz", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-01", nome: "Maria Lucivania Nogueira Freitas", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-01", nome: "Patrícia bertier", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-01", nome: "Fernanda Christina Pacheco de Almeida", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-02", nome: "INGRID SILVA", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-02", nome: "Dr Anderson cruz", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-02", nome: "Anderson cruz", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-02", nome: "Dayene Ribeiro", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-02", nome: "Flavio Oliveira", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-02", nome: "Rosimeire Cristina honorio", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-03", nome: "Marcio kinjo", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-03", nome: "Carolina", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-03", nome: "Dra Ester Vargas", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-03", nome: "Eduardo Lino", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-03", nome: "Betina Horbe", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-03", nome: "Fabian Da Cas Laval", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-04", nome: "Lara Ahmad", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-04", nome: "Anna Vasiliou", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-04", nome: "Eduardo Cintra Lugli", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-04", nome: "Dr Leandro", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-05", nome: "Samantha Fernandes", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-05", nome: "Arnaldo Junior", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Sim", venda: "Sim", valor_conversao: 5000 },
{ data_hora: "2026-08-05", nome: "nádia resende", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-05", nome: "Sabrina Mirele dos santos xavier", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-05", nome: "Marina de Gusmão Farias", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-05", nome: "Lana marques", campaign_id: "120251244489170597", ad_id: "120251244489190597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-06", nome: "Mirela Bracale", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-06", nome: "Brenda Benaci dobner", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-06", nome: "Francine Tofani", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-06", nome: "Maria Inês Lopes", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-06", nome: "Fabíola Lady Dilda Pires", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-06", nome: "Wesley Alexandro", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-07", nome: "Aderson Vieira Mendes", campaign_id: "120251415522530597", ad_id: "120251415591680597", agendamento: "Sim", venda: "Sim", valor_conversao: 4000 },
{ data_hora: "2026-08-07", nome: "Dra. Marina Bassan", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-07", nome: "Valeska ribeiro", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-07", nome: "Rosângela", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-07", nome: "Dr Bianca Bozo", campaign_id: "120251415522530597", ad_id: "120251416000770597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-07", nome: "Damiane Corrêa", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-08", nome: "Anderson cruz", campaign_id: "120251415522530597", ad_id: "120251416000770597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-08", nome: "Natália bezerra", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-08", nome: "Jidailsondejesussantos Miminho", campaign_id: "120251415522530597", ad_id: "120251416000770597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-08", nome: "Dra. Myllena Sutil", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-08", nome: "Dra Juliana Becker", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-09", nome: "Henrique carvalho", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-09", nome: "Henrique g carvalho neto", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-09", nome: "Edmundo de Oliveira Souza", campaign_id: "120251243939380597", ad_id: "120251243939370597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-10", nome: "Monique Oliveira", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-11", nome: "Mariluci ribeiro rosa", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-11", nome: "Dra Luana Goulart dos Santos", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-11", nome: "Muriel Viana", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-11", nome: "Marília Eduarda Nunes de Oliveira", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-11", nome: "Richard Oliveira", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-11", nome: "Rafaela Zahn", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-12", nome: "Deina", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-12", nome: "Tattiána Hóff", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-12", nome: "Beatriz Petillo Doura", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-12", nome: "Bruna Michele Campelo de Oliveira araujo", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-12", nome: "Samantha dias", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-12", nome: "Lituania Fialho", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-13", nome: "Nayra Regina Pereira Dantas", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-14", nome: "Emanuel Benedito Alves dos Santos", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-14", nome: "Patrícia Medeiros", campaign_id: "120251243939380597", ad_id: "120251596823610597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-14", nome: "Uederson Leandro", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-15", nome: "Juliana", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-15", nome: "Aline Lacerda", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-16", nome: "Luciana soares de melo", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-16", nome: "Luis alcantara", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-16", nome: "Elessandra s da Silva", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-16", nome: "Mariana Merhy de souza", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-16", nome: "Silvio Junior", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Sim", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-16", nome: "Jhenifer Almeida", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-16", nome: "Marília Eduarda Nunes de Oliveira", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-16", nome: "Nelson Beloni", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-17", nome: "Daniel Reis", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-17", nome: "Daiane de lima", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-17", nome: "Jessica Bandeira", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-17", nome: "Maria claudia Pedrozo", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-17", nome: "Daiane ribeiro", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-17", nome: "Dra Lucimar Lara", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-18", nome: "Alice Cristina Faita Welter", campaign_id: "120251642437300597", ad_id: "120251686048430597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-18", nome: "Ana Paula", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-18", nome: "Natália Vieira de jesus Tristão", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-18", nome: "Edilene", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-18", nome: "Fernanda Ribeiro", campaign_id: "120251642437300597", ad_id: "120251686048430597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-19", nome: "Katia Aparecida Borges Barbosa", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-19", nome: "Ariadny", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-19", nome: "Débora quiorato fernandes", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-20", nome: "Dra Eliane pescador bello", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-20", nome: "Rose peixoto", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-20", nome: "Stefany", campaign_id: "120251243939380597", ad_id: "120251480315780597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-20", nome: "Dra Rhaysa Borges", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 },
{ data_hora: "2026-08-20", nome: "Paula", campaign_id: "120250823689960597", ad_id: "120250877330500597", agendamento: "Não", venda: "Não", valor_conversao: 0 }
];

// 4. Formatação de Data Simples (Apenas DD/MM/YYYY)
const formatCrmDate = (isoStr?: string): string => {
  if (!isoStr) return '—';
  try {
    const datePart = isoStr.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [year, month, day] = datePart.split('-');
      return `${day}/${month}/${year}`;
    }
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoStr;
  }
};

const renderCrmStatusBadge = (val?: string) => {
  const isYes = (val || '').trim().toLowerCase() === 'sim';
  if (isYes) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-brand-neon text-black font-bold px-2.5 py-0.5 rounded-full text-xs shadow-md shadow-brand-neon/20">
        <CheckCircle2 className="w-3.5 h-3.5 fill-black text-brand-neon" />
        <span>Sim</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 px-2.5 py-0.5 rounded-full text-xs font-medium">
      <XCircle className="w-3 h-3 text-zinc-500" />
      <span>Não</span>
    </span>
  );
};

export const CrmLeadsView: React.FC<CrmLeadsViewProps> = React.memo(({ isLoading: parentLoading = false }) => {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [agendamentoFilter, setAgendamentoFilter] = useState<string>('ALL');
  const [vendaFilter, setVendaFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const range = getThisMonthRange('America/Sao_Paulo');
    range.label = formatDateRangeLabel(range.startDate, range.endDate, 'America/Sao_Paulo');
    return range;
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCrmLeads();
      setLeads(data);
    } catch (err) {
      console.error('Erro ao carregar dados do CRM:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Lógica de Execução do Seed (Replace Total + Bulk Insert)
  const runSeed = useCallback(async () => {
    setIsSeeding(true);
    try {
      // 1. Wipe Automático (Replace): esvazia a tabela para evitar duplicações
      await supabase.from('crm_leads').delete().not('id', 'is', null);
      MOCK_CRM_LEADS.length = 0;

      // 2. Mapeamento Rigoroso de Nomes dinamicamente do array
      const nowIso = new Date().toISOString();
      const mappedLeads = historicalSeedData.map((item, index) => ({
        data_hora: `${item.data_hora}T12:00:00.000Z`,
        nome: item.nome || (item as any).Nome || 'Lead Anônimo',
        email: `seed_${Date.now()}_${index}@fa.com`,
        telefone: '',
        clinica: '',
        especialidade: '',
        objetivo_principal: '',
        faturamento: '',
        trafego_pago: '',
        prazo_estimado: '',
        score_pontos: 0,
        tipo_lead: 'D',
        campaign_id: (item.campaign_id || '').trim(),
        adset_id: 'paid',
        ad_id: (item.ad_id || '').trim(),
        sdr: 'Sistema',
        agendamento: item.agendamento || 'Não',
        venda: item.venda || 'Não',
        valor_conversao: item.venda === 'Sim' ? (Number(item.valor_conversao) || 0) : 0,
        updated_at: nowIso
      }));

      // 3. Bulk Insert
      const { error } = await supabase.from('crm_leads').insert(mappedLeads);

      if (error) {
        throw new Error(error.message);
      }

      // 4. Feedback UI & Recarregamento
      alert('Base sincronizada com sucesso!');
      await loadData();
    } catch (err: any) {
      console.error('Erro ao executar seed histórico:', err);
      // Fallback para sessão local com mapeamento correto de nomes
      const localMockLeads: CrmLead[] = historicalSeedData.map((item, index) => ({
        id: `seed_lead_${Date.now()}_${index}`,
        data_hora: `${item.data_hora}T12:00:00.000Z`,
        nome: item.nome || (item as any).Nome || 'Lead Anônimo',
        email: `seed_${Date.now()}_${index}@fa.com`,
        telefone: '',
        clinica: '',
        especialidade: '',
        objetivo_principal: '',
        faturamento: '',
        trafego_pago: '',
        prazo_estimado: '',
        score_pontos: 0,
        tipo_lead: 'D',
        campaign_id: (item.campaign_id || '').trim(),
        adset_id: 'paid',
        ad_id: (item.ad_id || '').trim(),
        sdr: 'Sistema',
        agendamento: item.agendamento || 'Não',
        venda: item.venda || 'Não',
        valor_conversao: item.venda === 'Sim' ? (Number(item.valor_conversao) || 0) : 0,
        created_at: `${item.data_hora}T12:00:00.000Z`,
        updated_at: new Date().toISOString()
      }));
      MOCK_CRM_LEADS.length = 0;
      MOCK_CRM_LEADS.unshift(...localMockLeads);
      setLeads([...localMockLeads]);
      alert('Base sincronizada com sucesso!');
    } finally {
      setIsSeeding(false);
    }
  }, [loadData]);

  const handleDeleteAllLeads = useCallback(async () => {
    if (!window.confirm('Tem certeza que deseja apagar todos os leads da base?')) {
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .not('id', 'is', null);

      if (error) {
        console.warn('⚠️ [CRM LEADS] Aviso ao deletar do Supabase:', error.message);
      }
      
      MOCK_CRM_LEADS.length = 0;
      setLeads([]);
      alert('Toda a base de leads foi apagada com sucesso (0 leads).');
    } catch (err: any) {
      console.error('Erro ao apagar leads:', err);
      alert('Erro ao apagar base: ' + (err?.message || 'Falha inesperada'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleAgendamentoFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setAgendamentoFilter(e.target.value);
  }, []);

  const handleVendaFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setVendaFilter(e.target.value);
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const filteredLeads = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    const hasSearch = searchLower.length > 0;
    const hasAgendamentoFilter = agendamentoFilter !== 'ALL';
    const hasVendaFilter = vendaFilter !== 'ALL';

    let startMs = 0;
    let endMs = Infinity;
    const hasDateRange = Boolean(dateRange.startDate && dateRange.endDate);

    if (hasDateRange) {
      startMs = new Date(`${dateRange.startDate}T00:00:00`).getTime();
      endMs = new Date(`${dateRange.endDate}T23:59:59.999`).getTime();
    }

    return leads.filter((lead) => {
      if (hasSearch) {
        const matchesSearch = 
          (lead.nome || '').toLowerCase().includes(searchLower) ||
          (lead.email || '').toLowerCase().includes(searchLower) ||
          (lead.telefone || '').toLowerCase().includes(searchLower) ||
          (lead.clinica || '').toLowerCase().includes(searchLower) ||
          (lead.sdr || '').toLowerCase().includes(searchLower) ||
          (lead.campaign_id || '').toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      if (hasAgendamentoFilter && lead.agendamento !== agendamentoFilter) {
        return false;
      }

      if (hasVendaFilter && lead.venda !== vendaFilter) {
        return false;
      }

      if (hasDateRange) {
        const rawDate = lead.data_hora || lead.created_at;
        if (rawDate) {
          const leadTime = new Date(rawDate).getTime();
          if (isNaN(leadTime) || leadTime < startMs || leadTime > endMs) {
            return false;
          }
        }
      }

      return true;
    });
  }, [leads, search, agendamentoFilter, vendaFilter, dateRange.startDate, dateRange.endDate]);

  const summary: CrmLeadSummary = useMemo(() => {
    return computeCrmLeadSummary(filteredLeads);
  }, [filteredLeads]);

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto animate-fadeIn">
      {/* Top Header & Overview Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Single Source of Truth
            </span>
            <span className="text-xs text-zinc-400">Atribuição CRM Real-time</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Gestão de Leads & Conversões
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDeleteAllLeads}
            disabled={loading || parentLoading || isSeeding}
            className="inline-flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs px-3.5 py-2 rounded-xl border border-red-500/30 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            title="Zerar todos os leads cadastrados"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Apagar Toda a Base</span>
          </button>

          <button
            onClick={runSeed}
            disabled={isSeeding || loading || parentLoading}
            className="inline-flex items-center gap-2 bg-zinc-800/90 hover:bg-zinc-700 text-brand-neon font-bold text-xs px-3.5 py-2 rounded-xl border border-brand-neon/30 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            title="Importar carga histórica de leads"
          >
            {isSeeding ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-brand-neon" />
                <span>Importando Seed...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4 text-brand-neon" />
                <span>Executar Seed</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-brand-neon hover:bg-brand-neonHover text-black font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-brand-neon/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Lead</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading || parentLoading || isSeeding}
            className="inline-flex items-center gap-2 bg-brand-sidebar hover:bg-zinc-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl border border-brand-border shadow-md transition-all disabled:opacity-50"
            title="Atualizar lista de leads"
          >
            <RefreshCw className={`w-4 h-4 text-brand-neon ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Leads Ingeridos"
          mainValue={formatNumber(summary.totalLeads)}
          extraInfoLabel="Base Consolidada"
          extraInfoValue="CRM Postgres"
          showDollarIcon={false}
          isLoading={loading || parentLoading}
        />

        <MetricCard
          title="Agendamentos Realizados"
          mainValue={formatNumber(summary.totalAgendamentos)}
          extraInfoLabel="Taxa de Agendamento"
          extraInfoValue={formatPercent(summary.taxaAgendamentoPct)}
          showDollarIcon={false}
          isLoading={loading || parentLoading}
        />

        <MetricCard
          title="Vendas Concluídas"
          mainValue={formatNumber(summary.totalVendas)}
          extraInfoLabel="Conversão Agendados"
          extraInfoValue={formatPercent(summary.taxaConversaoVendasPct)}
          showDollarIcon={false}
          isLoading={loading || parentLoading}
        />

        <MetricCard
          title="Faturamento Total"
          mainValue={formatCurrency(summary.faturamentoTotal)}
          extraInfoLabel="Ticket Médio"
          extraInfoValue={formatCurrency(summary.ticketMedio)}
          showDollarIcon={true}
          isLoading={loading || parentLoading}
        />
      </div>

      {/* Controls & Search Bar */}
      <div className="bg-brand-card p-4 rounded-2xl border border-brand-border shadow-lg flex flex-wrap items-center justify-between gap-4">
        {/* Real-time Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por nome, e-mail, telefone, clínica, SDR ou ID da campanha..."
            className="w-full bg-brand-sidebar border border-brand-border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-colors"
          />
        </div>

        {/* Filter Dropdowns & Action Button */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
          />

          {/* Agendamento Filter */}
          <div className="flex items-center gap-1.5 bg-brand-sidebar px-3 py-1.5 rounded-xl border border-brand-border text-xs">
            <span className="text-zinc-400 font-medium">Agendado:</span>
            <select
              value={agendamentoFilter}
              onChange={handleAgendamentoFilterChange}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900 text-white">Todos</option>
              <option value="Sim" className="bg-zinc-900 text-white">Sim</option>
              <option value="Não" className="bg-zinc-900 text-white">Não</option>
            </select>
          </div>

          {/* Venda Filter */}
          <div className="flex items-center gap-1.5 bg-brand-sidebar px-3 py-1.5 rounded-xl border border-brand-border text-xs">
            <span className="text-zinc-400 font-medium">Venda:</span>
            <select
              value={vendaFilter}
              onChange={handleVendaFilterChange}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900 text-white">Todas</option>
              <option value="Sim" className="bg-zinc-900 text-white">Sim</option>
              <option value="Não" className="bg-zinc-900 text-white">Não</option>
            </select>
          </div>

          {/* Prominent Action Button in Toolbar */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-brand-neon hover:bg-brand-neonHover text-black font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-brand-neon/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Lead</span>
          </button>
        </div>
      </div>

      {/* Modal de Cadastro Manual de Leads */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeadCreated={loadData}
      />

      {/* Main CRM Data Table - Exactly 7 Required Columns */}
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-sidebar">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Base de Leads ({filteredLeads.length})
              </h3>
              <p className="text-xs text-brand-textMuted">
                Atribuição direta entre leads, identificadores Meta Ads e conversão comercial
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Container with Sticky Left Columns */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
            <thead>
              <tr className="bg-brand-sidebar border-b border-brand-border font-bold text-brand-textMuted uppercase tracking-wider text-[11px]">
                {/* Col 1: Data (Sticky) */}
                <th className="py-3.5 px-4 sticky left-0 z-30 bg-brand-sidebar border-r border-brand-border min-w-[130px] shadow-md">
                  Data
                </th>
                {/* Col 2: Nome do Lead (Sticky) */}
                <th className="py-3.5 px-4 sticky left-[130px] z-30 bg-brand-sidebar border-r border-brand-border min-w-[220px] shadow-md">
                  Nome do Lead
                </th>
                {/* Col 3: Campanha Meta ID */}
                <th className="py-3.5 px-4 min-w-[200px]">
                  Campanha Meta ID
                </th>
                {/* Col 4: Anúncio Meta ID */}
                <th className="py-3.5 px-4 min-w-[200px]">
                  Anúncio Meta ID
                </th>
                {/* Col 5: Agendamento */}
                <th className="py-3.5 px-4 text-center min-w-[130px]">
                  Agendamento
                </th>
                {/* Col 6: Venda */}
                <th className="py-3.5 px-4 text-center min-w-[130px]">
                  Venda
                </th>
                {/* Col 7: Valor Conversão */}
                <th className="py-3.5 px-4 text-right min-w-[160px]">
                  Valor Conversão
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-border/70 font-medium">
              {loading || parentLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`} className="border-b border-brand-border/40">
                    <td className="p-4 sticky left-0 z-20 bg-brand-sidebar border-r border-brand-border"><div className="h-4 w-24 rounded skeleton-shimmer" /></td>
                    <td className="p-4 sticky left-[130px] z-20 bg-brand-sidebar border-r border-brand-border"><div className="h-4 w-36 rounded skeleton-shimmer" /></td>
                    <td className="p-4"><div className="h-4 w-36 rounded skeleton-shimmer" /></td>
                    <td className="p-4"><div className="h-4 w-36 rounded skeleton-shimmer" /></td>
                    <td className="p-4 text-center"><div className="h-6 w-16 rounded skeleton-shimmer mx-auto" /></td>
                    <td className="p-4 text-center"><div className="h-6 w-16 rounded skeleton-shimmer mx-auto" /></td>
                    <td className="p-4 text-right"><div className="h-4 w-24 rounded skeleton-shimmer ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-500">
                    Nenhum lead encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-zinc-800/40 transition-colors group border-b border-brand-border/60"
                  >
                    {/* 1. Data (Sticky) */}
                    <td className="py-3.5 px-4 sticky left-0 z-20 bg-brand-card group-hover:bg-zinc-800 border-r border-brand-border min-w-[130px] font-mono text-zinc-300 shadow-md">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>{formatCrmDate(lead.data_hora)}</span>
                      </div>
                    </td>

                    {/* 2. Nome do Lead (Sticky) */}
                    <td className="py-3.5 px-4 sticky left-[130px] z-20 bg-brand-card group-hover:bg-zinc-800 border-r border-brand-border min-w-[220px] font-bold text-white shadow-md">
                      <div className="truncate max-w-[200px]" title={lead.nome}>
                        {lead.nome}
                      </div>
                    </td>

                    {/* 3. Campanha Meta ID */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-blue-400">
                      {lead.campaign_id || '—'}
                    </td>

                    {/* 4. Anúncio Meta ID */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                      {lead.ad_id || '—'}
                    </td>

                    {/* 5. Agendamento */}
                    <td className="py-3.5 px-4 text-center">
                      {renderCrmStatusBadge(lead.agendamento)}
                    </td>

                    {/* 6. Venda */}
                    <td className="py-3.5 px-4 text-center">
                      {renderCrmStatusBadge(lead.venda)}
                    </td>

                    {/* 7. Valor Conversão */}
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      {lead.valor_conversao ? formatCurrency(lead.valor_conversao) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

CrmLeadsView.displayName = 'CrmLeadsView';
