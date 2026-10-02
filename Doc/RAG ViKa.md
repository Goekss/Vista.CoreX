# Vista.Core — VIKA ChatBot Stack Kesinleşmiş Karar

> **İsim:** VIKA — Vista Intelligenter Kundenassistent  
> **Tarih:** 2026-04-29  
> **Maliyet:** $0  
> **Durum:** TÜM BACKEND FAZLARI TAMAMLANDI ✅

---

## KESİNLEŞMİŞ BİLEŞENLER

| Katman | Teknoloji | Versiyon | Görevi | NuGet / Image |
|--------|-----------|---------|--------|---------------|
| **Orkestrasyon** | Semantic Kernel | 1.x | Prompt yönetimi, plugin sistemi, LLM çağrısı | `Microsoft.SemanticKernel` |
| **RAG Engine** | Kernel Memory | 0.x | Döküman indeksleme, chunking, retrieval | `Microsoft.KernelMemory.Core` |
| **LLM** | Phi-4 Mini (via Ollama) | phi4-mini | Cevap üretimi | `ollama/ollama` (Docker) |
| **Embedding** | nomic-embed-text (via Ollama) | — | Metin → vektör dönüşümü | Ollama içinde |
| **Vector Store** | Qdrant | 1.x | Vektör depolama + arama | `qdrant/qdrant` (Docker) |
| **Streaming** | SignalR (mevcut) | .NET 9 | Gerçek zamanlı cevap akışı | Zaten mevcut |
| **Cache / Rate Limit** | Redis (mevcut) | — | Mandant bazlı istek limiti | Zaten mevcut |

---

## MİMARİ DİYAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                        │
│  ChatBot Widget (SignalR bağlantı)                       │
└──────────────────────┬──────────────────────────────────┘
                       │ WebSocket (SignalR)
                       ▼
┌─────────────────────────────────────────────────────────┐
│               VISTA.CORE BACKEND (.NET 9)                │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ ChatBot     │→ │ Input Filter │→ │ Rate Limiter   │  │
│  │ Hub/Controller│ │ (güvenlik)   │  │ (Redis+Mandant)│  │
│  └─────────────┘  └──────────────┘  └────────┬───────┘  │
│                                               │          │
│  ┌────────────────────────────────────────────▼───────┐  │
│  │              SEMANTIC KERNEL                        │  │
│  │  ┌──────────────────┐  ┌─────────────────────────┐ │  │
│  │  │ System Prompt     │  │ Plugins                 │ │  │
│  │  │ (CRM asistan      │  │ - KundePlugin           │ │  │
│  │  │  kuralları)        │  │ - TicketPlugin          │ │  │
│  │  └──────────────────┘  │ - ProjektPlugin          │ │  │
│  │                        └─────────────────────────┘ │  │
│  └───────────────────────────┬────────────────────────┘  │
│                              │                           │
│  ┌───────────────────────────▼────────────────────────┐  │
│  │            KERNEL MEMORY (RAG)                      │  │
│  │  1. Soruyu embedding'e çevir (nomic-embed-text)     │  │
│  │  2. Qdrant'ta benzer vektörleri ara                  │  │
│  │  3. İlgili chunk'ları kontekst olarak döndür         │  │
│  │  4. Relevance score < 0.7 → "Bilmiyorum"            │  │
│  └───────────┬───────────────┬────────────────────────┘  │
│              │               │                           │
│              ▼               ▼                           │
│  ┌───────────────┐  ┌─────────────────┐                  │
│  │ Output Filter │  │ PII Scanner     │                  │
│  │ (son kontrol) │  │ (hassas veri)   │                  │
│  └───────┬───────┘  └─────────────────┘                  │
│          │                                               │
└──────────┼───────────────────────────────────────────────┘
           │ SignalR Stream
           ▼
┌──────────────────┐
│  React ChatBot   │
│  (cevap göster)  │
└──────────────────┘

─── DOCKER ALTYAPI ───

┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│   Ollama       │  │   Qdrant       │  │   SQL Server   │
│   :11434       │  │   :6333        │  │   :1433        │
│                │  │                │  │                │
│ • phi4-mini    │  │ • vista_vectors│  │ • Kunde        │
│ • nomic-embed  │  │   (collection) │  │ • Ticket       │
└────────────────┘  └────────────────┘  │ • Projekt ...  │
                                        └────────────────┘
┌────────────────┐  ┌────────────────┐
│   Redis        │  │   Vista API    │
│   :6379        │  │   :8080        │
│                │  │                │
│ • 2FA kod      │  │ • Controllers  │
│ • Rate limit   │  │ • ChatBotHub   │
└────────────────┘  └────────────────┘
```

---

## VERİ AKIŞI

```
ADIM 1: Kullanıcı → "Müşteri FLYPGS'nin açık ticketları ne?"
ADIM 2: InputFilter → güvenlik kontrolü ✅
ADIM 3: RateLimiter → günlük kota kontrolü (Redis) ✅
ADIM 4: Kernel Memory → soruyu embed et → Qdrant'ta ara → ilgili chunk'ları bul
ADIM 5: Relevance score kontrolü → 0.85 > 0.7 ✅
ADIM 6: Semantic Kernel → System Prompt + Kontekst + Soru → Phi-4 Mini'ye gönder
ADIM 7: Phi-4 Mini → "FLYPGS'nin 2 açık ticketı var: T-1042 (Kritisch), T-1038 (Mittel)"
ADIM 8: OutputFilter → PII kontrolü ✅
ADIM 9: SignalR → React'e stream et
```

---

## HALÜSİNASYON ÖNLEME KATMANLARI

| # | Katman | Yöntem |
|---|--------|--------|
| 1 | **Temperature** | 0.1 (neredeyse deterministik) |
| 2 | **RAG Grounding** | Sadece DB verisinden cevap |
| 3 | **Relevance Eşik** | Score < 0.7 → "Bu bilgiye sahip değilim" |
| 4 | **System Prompt** | "Kontekstte yoksa uydurma" kuralı |
| 5 | **Structured Output** | JSON format zorunlu → serbest metin değil |
| 6 | **Kaynak Referansı** | Her cevaba hangi entity'den geldiğini ekle |

---

## DOCKER-COMPOSE EKLENTİSİ

```yaml
# Mevcut servislere ek olarak:
ollama:
  image: ollama/ollama:latest
  container_name: vistacore-ollama
  ports:
    - "11434:11434"
  volumes:
    - ollama_data:/root/.ollama
  restart: unless-stopped

qdrant:
  image: qdrant/qdrant:latest
  container_name: vistacore-qdrant
  ports:
    - "6333:6333"
  volumes:
    - qdrant_data:/qdrant/storage
  restart: unless-stopped

volumes:
  ollama_data:
  qdrant_data:
```

---

## NUGET PAKETLERİ

```xml
<!-- Vista.Core.csproj'a eklenecek -->
<PackageReference Include="Microsoft.SemanticKernel" Version="1.*" />
<PackageReference Include="Microsoft.KernelMemory.Core" Version="0.*" />
<PackageReference Include="Microsoft.KernelMemory.AI.Ollama" Version="0.*" />
<PackageReference Include="Microsoft.KernelMemory.MemoryDb.Qdrant" Version="0.*" />
```

---

## DOSYA YAPISI (Eklenecek)

```
Vista.Core/
├── Services/
│   ├── ChatBot/
│   │   ├── ChatBotService.cs          ← Ana servis (Semantic Kernel + Kernel Memory)
│   │   ├── ChatInputFilter.cs         ← Güvenlik filtresi
│   │   ├── ChatRateLimiter.cs         ← Mandant bazlı istek limiti
│   │   ├── ChatOutputFilter.cs        ← PII / hassas veri filtresi
│   │   └── DataIngestionService.cs    ← DB verisi → Qdrant'a indeksleme
│   └── ...
├── Hubs/
│   ├── ChatBotHub.cs                  ← SignalR hub (streaming cevap)
│   └── ...
├── Plugins/
│   ├── KundePlugin.cs                 ← "Müşteri bilgisi sorgula" plugin
│   ├── TicketPlugin.cs                ← "Ticket durumu sorgula" plugin
│   └── ProjektPlugin.cs              ← "Proje bilgisi sorgula" plugin
└── DTOs/
    └── ChatBot/
        ├── ChatBotRequestDto.cs
        └── ChatBotResponseDto.cs
```

---

## 🔴 OTURUM DEVİR BLOKU — VIKA CHATBOT

```
SON TAMAMLANAN ADIM : FAZ 4 — Backend Test Hazırlıkları (VikaAdminController)
AKTİF ADIM          : —
SONRAKİ ADIM        : REACT FRONTEND ENTEGRASYONU (Kullanıcı tarafından yapılacak)
KALDIĞIMIZ DOSYA    : —
NOTLAR              : Backend tarafında ChatBot (VIKA) için tüm servisler, filtreler, SignalR Hub, DataIngestion ve Docker/Ollama/Qdrant altyapısı kuruldu ve çalışır durumda. Test ve optimizasyon işlemleri Frontend üzerinden yapıldıktan sonra gerekirse tekrar Backend'de revizyon yapılacaktır.
```

---

## 📋 VIKA UYGULAMA FAZLARI

### FAZ 1 — Altyapı + Servisler + Hub ✅

- [x] **1.1** NuGet paketleri: `Microsoft.SemanticKernel`, `Microsoft.SemanticKernel.Connectors.Ollama`
- [x] **1.2** DTOs: `ChatBotRequestDto.cs`, `ChatBotResponseDto.cs`
- [x] **1.3** `ChatFilters.cs` → InputFilter + OutputFilter + RateLimiter (Redis + Mandant bazlı)
- [x] **1.4** `VikaChatBotService.cs` → Ana chatbot servisi (Semantic Kernel orkestrasyon)
- [x] **1.5** `VikaChatBotHub.cs` → SignalR hub (streaming cevap, token token gönderim)
- [x] **1.6** `Program.cs` → DI kaydı (Kernel, Ollama, VIKA servisleri) + Hub mapping `/hubs/vika`
- [x] **1.7** `appsettings.json` → Vika config (OllamaEndpoint, Model)
- [x] **1.8** Build testi → ✅ 0 hata

### FAZ 2 — RAG Plugins ✅

- [x] **2.1** `KundePlugin.cs` → 3 fonksiyon: `kunde_suchen`, `kunde_anzahl`, `kunde_details`
- [x] **2.2** `TicketPlugin.cs` → 3 fonksiyon: `offene_tickets`, `ticket_statistik`, `ticket_suchen`
- [x] **2.3** `ProjektPlugin.cs` → 3 fonksiyon: `aktive_projekte`, `projekt_statistik`, `projekt_suchen`
- [x] **2.4** Plugin'leri DI'a kaydet (Program.cs) + Kernel.Clone() ile scoped enjeksiyon
- [x] **2.5** `VikaChatBotService.cs` güncellendi → Plugin entegrasyonu + System Prompt güncellendi
- [x] **2.6** Build testi → ✅ 0 hata

### FAZ 3 — Docker + Ollama + Qdrant ✅

- [x] **3.1** `docker-compose.yml`'e Ollama + Qdrant container ekle
- [x] **3.2** `docker compose up` → tüm stack çalıştır
- [x] **3.3** `ollama pull phi4-mini` → model indir (2.5GB)
- [x] **3.4** `ollama pull nomic-embed-text` → embedding model indir (274MB)
- [x] **3.5** `DataIngestionService.cs` → KernelMemory + Qdrant entegrasyonu yazıldı.
- [x] **3.6** Bağlantı ayarları (`appsettings.json`) → `QdrantEndpoint`, `EmbeddingModel` eklendi.

### FAZ 4 — Test + Polish (FRONTEND'E DEVREDİLDİ) ✅

- [x] **4.0** `VikaAdminController` eklendi. `/api/VikaAdmin/daten-indizieren` endpoint'i ile ilk veriler manuel olarak indekslenebilir.
- [x] **4.1** Frontend testleri için hazırlıklar tamamlandı. Geri kalan SignalR streaming testi, halüsinasyon ve PII filtre testleri React tarafında yapılacak.

---

## 📁 OLUŞTURULAN / GÜNCELLENEN DOSYALAR

| Dosya | Durum | Açıklama |
|-------|-------|----------|
| `DTOs/ChatBot/ChatBotRequestDto.cs` | 🆕 FAZ 1 | Kullanıcı mesajı DTO |
| `DTOs/ChatBot/ChatBotResponseDto.cs` | 🆕 FAZ 1 | Bot yanıt DTO |
| `Services/ChatBot/ChatFilters.cs` | 🆕 FAZ 1 | Input/Output filtre + Rate limiter |
| `Services/ChatBot/VikaChatBotService.cs` | ✏️ FAZ 2 | Ana chatbot servisi + Plugin entegrasyonu |
| `Hubs/VikaChatBotHub.cs` | 🆕 FAZ 1 | SignalR streaming hub |
| `Controllers/VikaAdminController.cs` | 🆕 FAZ 4 | Test için data ingestion ve soru tetikleme |
| `Services/ChatBot/DataIngestionService.cs` | 🆕 FAZ 3 | KernelMemory ile DB verilerini vektörize eder |
| `Plugins/KundePlugin.cs` | 🆕 FAZ 2 | Müşteri arama/detay/sayım (3 fonksiyon) |
| `Plugins/TicketPlugin.cs` | 🆕 FAZ 2 | Ticket listele/istatistik/arama (3 fonksiyon) |
| `Plugins/ProjektPlugin.cs` | 🆕 FAZ 2 | Proje listele/istatistik/arama (3 fonksiyon) |
| `Program.cs` | ✏️ FAZ 1+2 | Semantic Kernel DI + Plugin DI + Hub mapping |
| `appsettings.json` | ✏️ FAZ 1+3 | Vika + Qdrant config eklendi |
| `Vista.Core.csproj` | ✏️ FAZ 1+3 | KernelMemory (Ollama, Qdrant) NuGet paketleri eklendi |

---

> ⚠️ **Sonraki agent için not:** VIKA ChatBot backend altyapısı tamamen kuruldu. Eğer testler sırasında bir optimizasyon, prompt mühendisliği veya plugin revizesi istenirse `VikaChatBotService.cs` ve ilgili `Plugin` dosyaları üzerinden müdahale ediniz.

---

## 🚀 YAPILACAKLAR (FRONTEND & TEST)

1. **İlk Veri Yüklemesi:** `/api/VikaAdmin/daten-indizieren` çağrılarak SQL verilerinin Qdrant'a vektörize edilmesi.
2. **React Chat UI:** Frontend üzerinde VIKA arayüzü tasarlanması (SignalR destekli stream yapısı).
3. **E2E Testler:**
   - Hallüsinasyon testi (Bilinmeyen soru sorulması).
   - Redis Rate-Limit testi (Arka arkaya istek).
   - PII Testi (Şifre vb. güvenlik filtresi).
4. **Optimizasyon:** Gerekirse prompt ve chunking ayarlarının iyileştirilmesi.
