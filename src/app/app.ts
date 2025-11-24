import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
// Import the echarts core module
import * as echarts from 'echarts/core';
// Import map charts
import { MapChart, ScatterChart } from 'echarts/charts';
// Import the tooltip, title, and geo components
import { TitleComponent, TooltipComponent, GeoComponent, VisualMapComponent } from 'echarts/components';
// Import the Canvas renderer
import { CanvasRenderer } from 'echarts/renderers';
import { EChartsOption } from 'echarts';
import { HttpClient } from '@angular/common/http';

// Register the required components
echarts.use([
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GeoComponent,
  MapChart,
  CanvasRenderer,
  ScatterChart
]);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, CommonModule, NgxEchartsDirective,],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {

  habitaciones: number | null = null;
  banos: number | null = null;
  parqueaderos: number | null = null;
  tamano: number | null = null;
  showErrorModal = false;
  mostrarMapa = false;
  chartOption: EChartsOption = {};
  cargando = false;
  MAPA_COMUNAS: Record<string, string> = {
    "Comuna 1": "Popular",
    "Comuna 2": "Santa Cruz",
    "Comuna 3": "Manrique",
    "Comuna 4": "Aranjuez",
    "Comuna 5": "Castilla",
    "Comuna 6": "Doce de Octubre",
    "Comuna 7": "Robledo",
    "Comuna 8": "Villa Hermosa",
    "Comuna 9": "Buenos Aires",
    "Comuna 10": "La Candelaria",
    "Comuna 11": "Laureles Estadio",
    "Comuna 12": "La América",
    "Comuna 13": "San Javier",
    "Comuna 14": "El Poblado",
    "Comuna 15": "Guayabal",
    "Comuna 16": "Belén",

    "Corregimiento 60": "Corregimiento de San Cristóbal",
    "Corregimiento 50": "Corregimiento de San Sebastián de Palmitas",
    "Corregimiento 70": "Corregimiento de Altavista",
    "Corregimiento 80": "Corregimiento de San Antonio de Prado",
    "Corregimiento 90": "Corregimiento de Santa Elena",

    "Sin asignar": "Sin asignar"
  };
  ranking_comunas: any;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.http.get<any>('assets/Medellin.geojson').subscribe(geo => {
      echarts.registerMap('medellin', geo);
      console.log("Mapa cargado");
      this.mostrarMapa = false;
    });
  }



  consultar() {
    if (
      this.habitaciones === null ||
      this.banos === null ||
      this.parqueaderos === null ||
      this.tamano === null
    ) {
      this.showErrorModal = true;
      return;
    } else {
      this.cargando = true;
      const body = {
        hab: this.habitaciones,
        banos: this.banos,
        parqueaderos: this.parqueaderos,
        areaconstruida: this.tamano
      };

      this.http.post<any>('https://qc6jdunhhf.execute-api.us-east-2.amazonaws.com/dev', body, {
        headers: { "Content-Type": "application/json" }
      }).subscribe(response => {
        console.log(response);

        let data = this.procesarRanking(response.ranking_comunas)
        console.log('Data', data)
        this.ranking_comunas = response.ranking_comunas;
        const min = Math.round(Math.min(...this.ranking_comunas.map((x: { precio_predicho: any; }) => x.precio_predicho)));
        const max = Math.round(Math.max(...this.ranking_comunas.map((x: { precio_predicho: any; }) => x.precio_predicho)));

        console.log("MIN:", min);
        console.log("MAX:", max);

        setTimeout(() => {
          console.log('--- Consulta realizada ---');
          console.log('Habitaciones:', this.habitaciones);
          console.log('Baños:', this.banos);
          console.log('Parqueaderos:', this.parqueaderos);
          console.log('Tamaño m2:', this.tamano);

          this.mostrarMapa = true;
          this.chartOption = {
            tooltip: {
              trigger: 'item',
              formatter: (params: any) => {
                if (params['data']['value'] == undefined) {
                  return `${params.data.name}<br/>Sin Información`;
                } else {
                  const numero = Number(params['data']['value']);
                  const valorFormateado = numero.toLocaleString('es-CO');
                  return `${params.data.name}<br/>Valor: $${valorFormateado} COP`;
                }

              },
            },

            visualMap: {
              min: min,
              max: max,
              left: 'left',
              top: 'bottom',
              text: ['Alto', 'Bajo'],
              calculable: true,
              inRange: {
                //color: ['#ffe7b3', '#ff9e3d', '#ff6f00']
                //color: ['#48dc12ff', '#e4d20cff', '#cc2200ff']
                color: ['#92bbdeff', '#115687ff']
              }
            },

            geo: {
              map: 'medellin',
              roam: false,
              label: {
                show: false,
                color: '#ffffffff',
                fontSize: 12,
              },
              itemStyle: {
                borderColor: '#fff',
                borderWidth: 1
              }
            },

            series: [
              {
                name: 'Comunas',
                type: 'map',
                map: 'medellin',
                label: {
                  show: true,
                  color: '#ffffffff',
                  formatter: (params: any) => {
                    if (params['data']['value'] == undefined) {
                      return '';
                    } else {
                      const value = params.value ?? 0;
                      return this.abrev(value);
                    }
                  }
                },
                emphasis: {
                  label: {
                    show: true
                  }
                },
                data: data
                /*data: [
                  { name: "Popular", value: 1 },
                  { name: "Santa Cruz", value: 2 },
                  { name: "Manrique", value: 3 },
                  { name: "Aranjuez", value: 4 },
                  { name: "Castilla", value: 5 },
                  { name: "Doce de Octubre", value: 6 },
                  { name: "Robledo", value: 7 },
                  { name: "Villa Hermosa", value: 8 },
                  { name: "Buenos Aires", value: 9 },
                  { name: "La Candelaria", value: 10 },
                  { name: "Laureles Estadio", value: 11 },
                  { name: "La América", value: 12 },
                  { name: "San Javier", value: 13 },
                  { name: "El Poblado", value: 14 },
                  { name: "Guayabal", value: 15 },
                  { name: "Belén", value: 16 },
   
                  // corregimientos
                  { name: "Corregimiento de San Cristóbal", value: 60 },
                  { name: "Corregimiento de San Sebastián de Palmitas", value: 50 },
                  { name: "Corregimiento de Altavista", value: 70 },
                  { name: "Corregimiento de San Antonio de Prado", value: 80 },
                  { name: "Corregimiento de Santa Elena", value: 90 },
                ]*/
              }
            ]
          };
          this.cargando = false;
        }, 500);
      });
    }




  }

  procesarRanking(ranking_comunas: any[]) {
    return ranking_comunas.map(item => ({
      name: this.MAPA_COMUNAS[item.comuna] || item.comuna,
      value: Math.round(item.precio_predicho)
    }));
  }

  abrev(value: number): string {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(1) + 'B';
    }
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(1) + 'M';
    }
    if (value >= 1_000) {
      return (value / 1_000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  cerrarModal() {
    this.showErrorModal = false;
  }

}
