export default {
    /**
     * Hodnota, která udává čas startu eventu, do kterého se event z následujícího dne zapíše do dne předchozího
     * Je to proto, protože lidem na festivalu typicky nekončí večerní program o půlnoci
     * 6 je v tomhle případe 06:00 AM
     * Příklad: event1 má start 2.1 01:00 AM - běžně by se měl zapsat už do 2.1, ale protože 01:00 AM spadá do 1 < 6, tak se zapíše do dne 1.1
     */
    eventStartHourThreshold: 6,
    /**
     * Hodnota, která udává v kolik event může nejpozději skončit, aby se pro něj NEvypsal nový den v seznamu dnů
     * Přímo souvisí s eventStartHourThreshold a fixuje situaci, kdy je event, který probíhá po půlnoci zapsán do předchozího dne, ale v seznamu dní je pro něj už vytvořený den (protože se obsah dne vyhodnocuje po vybrání)
     * Příklad: event začíná 1.1 01:00 AM a končí 1.1 05:00 AM. Správně se ještě zapíše do dne 1.1 (díky eventStartHourThreshold), ale vypíše se pro něj v seznamu dní den 2.1, to nechceme
     * Tedy pokud event končí v 05:00 AM, tak 5 < 8 a nový den se nevypíše. Pokud by končil v 09:00 AM, tak už se pro něj nový den vyrobí, ale takový event bude pravděpodobně začínat po eventStartHourThreshold
     * Pokud by byl někdy nonstop program končící poslední den ráno, tak se tohle řešení bude muset předělat a počítat segmenty programu dopředu
     */
    eventEndHourThreshold: 8,
}