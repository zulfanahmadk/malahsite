<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $groom_name }} & {{ $bride_name }} - Undangan Pernikahan</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 20px;
            text-align: center;
        }

        .header h1 {
            font-size: 36px;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .header p {
            font-size: 18px;
            opacity: 0.9;
        }

        .content {
            padding: 40px 20px;
        }

        .section {
            margin-bottom: 40px;
        }

        .section-title {
            color: #667eea;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }

        .couple-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        .couple {
            text-align: center;
        }

        .couple h3 {
            color: #333;
            font-size: 20px;
            margin-bottom: 5px;
        }

        .couple p {
            color: #666;
            font-size: 14px;
        }

        .event-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .detail-row {
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 20px;
            margin-bottom: 15px;
        }

        .detail-row:last-child {
            margin-bottom: 0;
        }

        .detail-label {
            font-weight: 600;
            color: #667eea;
        }

        .detail-value {
            color: #333;
        }

        .love-story {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            line-height: 1.6;
            color: #555;
        }

        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }

        .gallery img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 8px;
        }

        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }

        .divider {
            height: 2px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            margin: 30px 0;
        }

        @media (max-width: 600px) {
            .header h1 {
                font-size: 24px;
            }

            .couple-info {
                grid-template-columns: 1fr;
            }

            .detail-row {
                grid-template-columns: 1fr;
            }

            .gallery {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>{{ $groom_name }} & {{ $bride_name }}</h1>
            <p>dengan hormat mengundang Anda merayakan pernikahan kami</p>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Couple Info -->
            @if($groom_name || $bride_name)
            <div class="section">
                <div class="section-title">Pasangan Pengantin</div>
                <div class="couple-info">
                    <div class="couple">
                        <h3>{{ $groom_name }}</h3>
                        @if($groom_father_name || $groom_mother_name)
                        <p>Putra dari:</p>
                        <p>{{ $groom_father_name ?? 'Bpk.' }} & {{ $groom_mother_name ?? 'Ibu.' }}</p>
                        @endif
                    </div>
                    <div class="couple">
                        <h3>{{ $bride_name }}</h3>
                        @if($bride_father_name || $bride_mother_name)
                        <p>Putri dari:</p>
                        <p>{{ $bride_father_name ?? 'Bpk.' }} & {{ $bride_mother_name ?? 'Ibu.' }}</p>
                        @endif
                    </div>
                </div>
            </div>
            @endif

            <div class="divider"></div>

            <!-- Event Details -->
            @if($event_date || $ceremony_location)
            <div class="section">
                <div class="section-title">Detail Acara</div>
                <div class="event-details">
                    @if($event_date)
                    <div class="detail-row">
                        <div class="detail-label">Tanggal</div>
                        <div class="detail-value">
                            {{ \Carbon\Carbon::parse($event_date)->translatedFormat('l, j F Y') }}
                        </div>
                    </div>
                    @endif

                    @if($ceremony_time)
                    <div class="detail-row">
                        <div class="detail-label">Waktu Acara</div>
                        <div class="detail-value">
                            {{ \Carbon\Carbon::parse($ceremony_time)->format('H:i') }} WIB
                        </div>
                    </div>
                    @endif

                    @if($ceremony_location)
                    <div class="detail-row">
                        <div class="detail-label">Lokasi Acara</div>
                        <div class="detail-value">{{ $ceremony_location }}</div>
                    </div>
                    @endif

                    @if($reception_location)
                    <div class="detail-row">
                        <div class="detail-label">Resepsi</div>
                        <div class="detail-value">{{ $reception_location }}</div>
                    </div>
                    @endif

                    @if($reception_google_maps_link)
                    <div class="detail-row">
                        <div class="detail-label">Lokasi Map</div>
                        <div class="detail-value">
                            <a href="{{ $reception_google_maps_link }}" target="_blank" style="color: #667eea; text-decoration: none;">
                                Buka di Google Maps →
                            </a>
                        </div>
                    </div>
                    @endif
                </div>
            </div>
            @endif

            @if($love_story)
            <div class="divider"></div>

            <!-- Love Story -->
            <div class="section">
                <div class="section-title">Cerita Cinta Kami</div>
                <div class="love-story">
                    {{ $love_story }}
                </div>
            </div>
            @endif

            @if(count($photo_gallery) > 0)
            <div class="divider"></div>

            <!-- Photo Gallery -->
            <div class="section">
                <div class="section-title">Galeri Foto</div>
                <div class="gallery">
                    @foreach($photo_gallery as $photo)
                    <img src="{{ $photo }}" alt="Wedding photo">
                    @endforeach
                </div>
            </div>
            @endif
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Terima kasih telah menjadi bagian dari kebahagiaan kami</p>
            <p style="margin-top: 10px; font-size: 12px; color: #999;">
                Created with MaLah - Platform Undangan Digital Pernikahan
            </p>
        </div>
    </div>
</body>
</html>
