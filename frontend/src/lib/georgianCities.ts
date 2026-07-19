export type GeorgianCity = { en: string; ka: string }

export const GEORGIAN_CITIES: GeorgianCity[] = [
  { en: 'Tbilisi', ka: 'თბილისი' },
  { en: 'Batumi', ka: 'ბათუმი' },
  { en: 'Kutaisi', ka: 'ქუთაისი' },
  { en: 'Rustavi', ka: 'რუსტავი' },
  { en: 'Gori', ka: 'გორი' },
  { en: 'Zugdidi', ka: 'ზუგდიდი' },
  { en: 'Poti', ka: 'ფოთი' },
  { en: 'Khashuri', ka: 'ხაშური' },
  { en: 'Samtredia', ka: 'სამტრედია' },
  { en: 'Senaki', ka: 'სენაკი' },
  { en: 'Zestaponi', ka: 'ზესტაფონი' },
  { en: 'Marneuli', ka: 'მარნეული' },
  { en: 'Telavi', ka: 'თელავი' },
  { en: 'Akhaltsikhe', ka: 'ახალციხე' },
  { en: 'Kobuleti', ka: 'ქობულეთი' },
  { en: 'Ozurgeti', ka: 'ოზურგეთი' },
  { en: 'Kaspi', ka: 'კასპი' },
  { en: 'Chiatura', ka: 'ჭიათურა' },
  { en: 'Sagarejo', ka: 'საგარეჯო' },
  { en: 'Gardabani', ka: 'გარდაბანი' },
  { en: 'Borjomi', ka: 'ბორჯომი' },
  { en: 'Gurjaani', ka: 'გურჯაანი' },
  { en: 'Mtskheta', ka: 'მცხეთა' },
  { en: 'Kareli', ka: 'ქარელი' },
  { en: 'Khoni', ka: 'ხონი' },
  { en: 'Vani', ka: 'ვანი' },
  { en: 'Bagdati', ka: 'ბაღდათი' },
  { en: 'Terjola', ka: 'თერჯოლა' },
  { en: 'Sachkhere', ka: 'საჩხერე' },
  { en: 'Kharagauli', ka: 'ხარაგაული' },
  { en: 'Tkibuli', ka: 'ტყიბული' },
  { en: 'Tskaltubo', ka: 'წყალტუბო' },
  { en: 'Ambrolauri', ka: 'ამბროლაური' },
  { en: 'Oni', ka: 'ონი' },
  { en: 'Tsageri', ka: 'ცაგერი' },
  { en: 'Lentekhi', ka: 'ლენტეხი' },
  { en: 'Mestia', ka: 'მესტია' },
  { en: 'Abasha', ka: 'აბაშა' },
  { en: 'Martvili', ka: 'მარტვილი' },
  { en: 'Khobi', ka: 'ხობი' },
  { en: 'Chkhorotsku', ka: 'ჩხოროწყუ' },
  { en: 'Tsalenjikha', ka: 'წალენჯიხა' },
  { en: 'Lanchkhuti', ka: 'ლანჩხუთი' },
  { en: 'Chokhatauri', ka: 'ჩოხატაური' },
  { en: 'Keda', ka: 'ქედა' },
  { en: 'Khulo', ka: 'ხულო' },
  { en: 'Shuakhevi', ka: 'შუახევი' },
  { en: 'Khelvachauri', ka: 'ხელვაჩაური' },
  { en: 'Bolnisi', ka: 'ბოლნისი' },
  { en: 'Dmanisi', ka: 'დმანისი' },
  { en: 'Tetritskaro', ka: 'თეთრიწყარო' },
  { en: 'Tsalka', ka: 'წალკა' },
  { en: 'Manglisi', ka: 'მანგლისი' },
  { en: 'Akhalkalaki', ka: 'ახალქალაქი' },
  { en: 'Ninotsminda', ka: 'ნინოწმინდა' },
  { en: 'Aspindza', ka: 'ასპინძა' },
  { en: 'Adigeni', ka: 'ადიგენი' },
  { en: 'Vale', ka: 'ვალე' },
  { en: 'Dusheti', ka: 'დუშეთი' },
  { en: 'Tianeti', ka: 'თიანეთი' },
  { en: 'Akhmeta', ka: 'ახმეტა' },
  { en: 'Kvareli', ka: 'ყვარელი' },
  { en: 'Sighnaghi', ka: 'სიღნაღი' },
  { en: 'Tsnori', ka: 'წნორი' },
  { en: 'Dedoplistskaro', ka: 'დედოფლისწყარო' },
  { en: 'Lagodekhi', ka: 'ლაგოდეხი' },
  { en: 'Akhalgori', ka: 'ახალგორი' },
  { en: 'Stepantsminda', ka: 'სტეფანწმინდა' },
  { en: 'Surami', ka: 'სურამი' },
  { en: 'Bakuriani', ka: 'ბაკურიანი' },
  { en: 'Gudauri', ka: 'გუდაური' },
  { en: 'Anaklia', ka: 'ანაკლია' },
  { en: 'Ureki', ka: 'ურეკი' },
]

const KA_TO_EN = new Map(GEORGIAN_CITIES.map((c) => [c.ka, c.en]))

export function cityLabel(lang: 'en' | 'ka', city: GeorgianCity) {
  return lang === 'ka' ? city.ka : city.en
}

export function filterCities(query: string, lang: 'en' | 'ka') {
  const q = query.trim().toLowerCase()
  if (!q) return GEORGIAN_CITIES
  return GEORGIAN_CITIES.filter((city) => {
    const label = cityLabel(lang, city).toLowerCase()
    return label.includes(q) || city.en.toLowerCase().includes(q) || city.ka.includes(q)
  })
}

export function cityValueForSubmit(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return ''
  return KA_TO_EN.get(trimmed) ?? trimmed
}
